import { readConfig, setUser } from "./config";
import { fetchFeed } from "./fetch";
import { createFeedFollow, getFeedFollowsForUser, unfollowFeedFollow } from "./lib/db/queries/feed_follows";
import { createFeed, getFeed, getFeeds, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds";
import { createPost, getLatestPostsForUser } from "./lib/db/queries/posts";
import { createUser, getUser, deleteUser, getUsers } from "./lib/db/queries/users";
import { Feed, feeds, User } from "./schema";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandsRegistry = Record<string, CommandHandler>
type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

const middlewareLoggedIn: middlewareLoggedIn = (handler: UserCommandHandler): CommandHandler => {
    return async (cmdName: string, ...args: string[]) => {
        const user = await getCurrentUser();
        return handler(cmdName, user, ...args);
    }
}

function handleError(error: unknown): void {
    if (error instanceof Error) {
        console.error(`Feed scraping error: ${error.message}`);
        if (error.message.includes('fetch')) {
            console.error('Network or fetch error occurred');
        } else if (error.message.includes('parse') || error.message.includes('XML')) {
            console.error('Feed parsing error - invalid XML/RSS format');
        } else if (error.message.includes('timeout')) {
            console.error('Request timeout - feed took too long to respond');
        } else {
            console.error('Unknown feed processing error');
        }
    } else {
        console.error('Unexpected error type:', error);
    }
    
}

async function getCurrentUser(): Promise<User> {
    const { currentUserName } = readConfig();
    const user = await getUser(currentUserName);
    if (!user) {
        throw new Error("No current user configured. Please login or register first.");
    }
    return user;
}

export async function handlerLogin(cmdName: string, ...args: string[]):Promise<void>{
    if(args.length === 0 || args.length > 1){
        throw new Error("Excpeted username");
    }
    const userName = args[0];
    const user = await getUser(userName);
    if (!user) {
        throw new Error(`User '${userName}' not found. Please register first.`);
    }
    setUser(userName);
    console.log(`Username: ${userName} has been set`);
};

export async function handlerRegsiter(cmdName: string, ...args:string[]):Promise<void>{
    const userName = args[0];
    if(args.length === 0 || args.length > 1){
        throw new Error("Excpeted username");
    }
    const isUser = await getUser(userName);
    if (isUser){
        throw new Error(`User: ${userName} already exists!!`);
    }
    const user = await createUser(userName);
    setUser(userName);
    console.log(`User: ${userName} was created!!`)
}

export async function handlerDelete(cmdName: string, ...args: string[]): Promise<void> {
    console.log("Deleting all users...");
    const result = await deleteUser();
    console.log("All users have been deleted");
}
export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
    const users = await getUsers();
    const {currentUserName} = readConfig();
    for(const user of users){
        console.log(`* ${user.name}${currentUserName===user.name?" (current)":""}`);
    }
}
async function scrapeFeeds(){
    await fetchFeed("https://techcrunch.com/feed/");
    const nextFeed = await getNextFeedToFetch();
    await markFeedFetched(nextFeed.id);
    const feed = await fetchFeed(nextFeed.url);
    if(!feed) throw new Error(`Not able to fecth the feed ${nextFeed.name}`);
    for(const i of feed.channel.item){
        await createPost(i, nextFeed.id);
    } 
}
export async function handlerAgg(cmdName: string, ...args: string[]):Promise<void>{
    const timeBetween = args[0];
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = timeBetween.match(regex);
    if(!match) throw new Error("Time must be ms/s/m/h");
    console.log(`Collecting feeds every ${timeBetween}`);
    scrapeFeeds().catch(handleError);
    const value = Number(match[1]);
    const unit = match[2];
    let intervalMs: number;
    switch (unit) {
        case "ms":
            intervalMs = value;
            break;
        case "s":
            intervalMs = value * 1000;
            break;
        case "m":
            intervalMs = value * 60 * 1000;
            break;
        case "h":
            intervalMs = value * 60 * 60 * 1000;
            break;
        default:
            throw new Error("Unsupported time unit");
    }
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
        throw new Error("Invalid interval");
    }
    const interval = setInterval(() => scrapeFeeds().catch(handleError), intervalMs);
    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}
function printFeed(feed: Feed, user: User | undefined){
    console.log(`Feed: ${feed.name} and user: ${user ? user.name : "unknown"}`);
}
const handlerFeedLogic = async (cmdName: string, user: User, ...args: string[]): Promise<void> => {
    const name = args[0];
    const url = args[1];
    const newFeed = await createFeed(name, url);
    if (!newFeed) {
        throw new Error(`Failed to create feed '${name}'.`);
    }
    await createFeedFollow(newFeed);
    printFeed(newFeed, user);
};

export const handlerFeed = middlewareLoggedIn(handlerFeedLogic);
export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void>{
    await getFeeds();
}
const handlerFollowLogic = async (cmdName: string, user: User, ...args: string[]): Promise<void> => {
    const url = args[0];
    const feed = await getFeed(url);
    if (!feed){
        throw new Error("No feed found.");
    }
    const feedFollow = await createFeedFollow(feed);
    console.log(`Feed: ${feedFollow.feedName} and username: ${feedFollow.userName}`);
};

export const handlerFollow = middlewareLoggedIn(handlerFollowLogic);
const handlerFollowingLogic = async (cmdName: string, user: User, ...args: string[]): Promise<void> => {
    const following = await getFeedFollowsForUser(user.id);
    for(const follow of following){
        console.log(`Feed: ${follow.feedName} followed by: ${follow.userName}`);
    }
};
const handlerUnfollowLogic = async(cmdName: string, user: User, ...args: string[]): Promise<void> => {
    const url = args[0];
    const unfollowed = await unfollowFeedFollow(url, user);
    if (unfollowed.count > 0){
        console.log(`User ${user.name} unfollowed ${url}`)
    }else {
        console.log("No follow relationship found to delete");
    }
};

export const handlerUnfollow = middlewareLoggedIn(handlerUnfollowLogic);
    

export const handlerFollowing = middlewareLoggedIn(handlerFollowingLogic);
export async function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler):Promise<void>{
    registry.cmdName = handler;
};
export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error(`Command '${cmdName}' not found`);
    }
    await handler(cmdName, ...args);
}

const handlerBrowsePostLogic = async(cmdName: string, user: User, ...args: string[]): Promise<void> => {
    console.log("Starting to browse posts...");
    const limit = typeof(args[0]) === "number" ? args[0] : 2;
    const latestPost = await getLatestPostsForUser(user.id, limit);
    for(const post of latestPost){
        console.log(`Post ${post.title} link: ${post.url}`);
        console.log(`Description: ${post.description}`);
    }
}

export const handlerBrowse = middlewareLoggedIn(handlerBrowsePostLogic);