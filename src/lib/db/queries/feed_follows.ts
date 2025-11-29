import { db } from "../index";
import {Feed, feed_follows, feeds, User, users} from "../../../schema";
import { eq, gt, and, or } from 'drizzle-orm';
import { stringify } from "querystring";
import { readConfig } from "src/config";
import { getUser } from "./users";

export async function createFeedFollow(feed: Feed){
    const {currentUserName} = readConfig();
        const user = await getUser(currentUserName);
        if (!user) {
            throw new Error(`User '${currentUserName}' not found`);
        };
    const [result] = await db.insert(feed_follows).values({
        user_id: user.id,
        feed_id: feed.id,
    });
    const feedInfo = await db.select({
        followId: feed_follows.id,
        userId: feed_follows.user_id,
        feedId: feed_follows.feed_id,
        userName: users.name,
        feedName: feeds.name
    }).from(feed_follows)
        .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
        .innerJoin(users, eq(feed_follows.user_id, users.id));
    return feedInfo;
};
