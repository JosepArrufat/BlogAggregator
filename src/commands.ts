import { readConfig, setUser } from "./config";
import { fetchFeed } from "./fetch";
import { createFeedFollow } from "./lib/db/queries/feed_follows";
import { createFeed, getFeed, getFeeds } from "./lib/db/queries/feeds";
import { createUser, getUser, deleteUser, getUsers } from "./lib/db/queries/users";
import { Feed, feeds, User } from "./schema";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandsRegistry = Record<string, CommandHandler>

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
export async function handlerAgg(cmdName: string, ...args: string[]):Promise<void>{
    const feed = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(JSON.stringify(feed, null, 2));
}
function printFeed(feed: Feed, user: User | undefined){
    console.log(`Feed: ${feed.name} and user: ${user ? user.name : "unknown"}`);
}
export async function handlerFeed(cmdName: string, ...args: string[]):Promise<void>{
    const name = args[0];
    const url = args[1];
    const {currentUserName} = readConfig();
    const user = await getUser(currentUserName);
    if (!user) {
        throw new Error("No current user configured. Please login or register first.");
    }
    const newFeed = await createFeed(name, url);
    if (!newFeed) {
        throw new Error(`Failed to create feed '${name}'.`);
    }
    printFeed(newFeed, user);
}
export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void>{
    await getFeeds();
}
export async function handlerFollow(cmdName: string, ...args: string[]) {
    const url = args[0];
    const {currentUserName} = readConfig();
    const user = await getUser(currentUserName);
    if (!user) {
        throw new Error("No current user configured. Please login or register first.");
    }
    const feed = await getFeed(url);
    if (!feed){
        throw new Error("No feed found.");
    }
    const feedFollow = await createFeedFollow(feed);
}
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

