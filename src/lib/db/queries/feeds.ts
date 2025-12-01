import { db } from "../index";
import {feeds, User, users} from "../../../schema";
import { eq, gt, and, or, sql } from 'drizzle-orm';
import { stringify } from "querystring";
import { readConfig } from "src/config";
import { getUser } from "./users";

export async function createFeed(name:string, url: string){
    const {currentUserName} = readConfig();
    const user = await getUser(currentUserName);
    if (!user) {
        throw new Error(`User '${currentUserName}' not found`);
    }
    const [result] = await db.insert(feeds).values({
        name:name,
        url: url,
        user_id: user.id
    }).returning();
    return result;
};

export async function getFeeds(){
    const allFeeds = await db.select().from(feeds);
    for(const feed of allFeeds){
        const [user, ]: User[] = await db.select().from(users).where(eq(users.id, feed.user_id));
        console.log(`Feed name: ${feed.name}, url: ${feed.url}, createdBy: ${user.name}`)
    }
}

export async function getFeed(url: string){
    try{
        const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
        return feed;
    }catch(e){
        return undefined;
    }
};

export async function markFeedFetched(feedID: string){
    await db.update(feeds)
        .set({last_fetched_at: new Date, updatedAt: new Date})
        .where(eq(feeds.id, feedID));
};

export async function getNextFeedToFetch(){
    const [feed] = await db.select()
        .from(feeds)
        .orderBy(sql`${feeds.last_fetched_at} nulls first`)
        .limit(1);
    return feed;
}