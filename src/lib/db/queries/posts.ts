import { RSSItem } from "src/fetch";
import { Feed, posts, feed_follows } from "src/schema";
import { db } from "..";
import { desc, eq } from "drizzle-orm";

export async function getLatestPostsForUser(userId: string, limit: number = 2) {
    return await db
        .select({
            id: posts.id,
            title: posts.title,
            url: posts.url,
            description: posts.description,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            feed_id: posts.feed_id
        })
        .from(posts)
        .innerJoin(feed_follows, eq(posts.feed_id, feed_follows.feed_id))
        .where(eq(feed_follows.user_id, userId))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
}

export async function createPost(post: RSSItem, feedId: string){
    const {title, link, description, pubDate} = post;
    const standardPubDate = standardizeDate(pubDate);
    
    await db.insert(posts).values({
        title,
        url: link,
        description,
        publishedAt: standardPubDate,
        feed_id: feedId,
    });
}

function standardizeDate(dateString: string): Date {
    if (!dateString || dateString.trim() === '') {
        return new Date();
    }
    
    try {
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        let cleaned = dateString.trim();
        cleaned = cleaned.replace(/\b[A-Z]{2,4}\b$/, '').trim();
        const rfc822Match = cleaned.match(/^(\w+,\s*)?(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4})?/);
        if (rfc822Match) {
            const [, , day, month, year, hour, minute, second = '0', timezone] = rfc822Match;
            const monthNum = getMonthNumber(month);
            if (monthNum !== -1) {
                const isoString = `${year}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second.padStart(2, '0')}${timezone || 'Z'}`;
                return new Date(isoString);
            }
        }
        const secondParsed = new Date(cleaned);
        if (!isNaN(secondParsed.getTime())) {
            return secondParsed;
        }
        console.warn(`Unable to parse date: "${dateString}". Using current date.`);
        return new Date();
        
    } catch (error) {
        console.warn(`Error parsing date: "${dateString}". Using current date.`, error);
        return new Date();
    }
}

function getMonthNumber(monthName: string): number {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const index = months.findIndex(m => monthName.toLowerCase().startsWith(m));
    return index !== -1 ? index + 1 : -1;
}