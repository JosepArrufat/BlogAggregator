import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string):Promise<RSSFeed | null>{
    try {
        const res = await fetch(feedURL, {
            method: "GET",
            headers: {
                'Content-Type': 'application/xml',
                'User-Agent': 'gator',
            }
        });
        if(!res.ok) throw new Error("Failed to fetch link");
        const urlXML = await res.text();
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            parseTagValue: false,
            allowBooleanAttributes: true
        });
        const jsObj = parser.parse(urlXML);
        const channelObj = jsObj.channel ?? jsObj.rss?.channel;
        if(!channelObj) throw new Error("No channel field found");
        const {title, link, description, item} = channelObj;
        if(!title || !link || !description) throw new Error("Missing channel properties");
        const isArray = Array.isArray(item);
        const feed:RSSFeed = {
            channel: {
                title,
                link,
                description,
                item: []
            }
        }
        if(!item){
        } else if(!isArray){
            const {
                title: itemTitle,
                link: itemLink,
                description: itemDescription,
                pubDate
            } = item;
            feed.channel.item.push({
                title: itemTitle ?? "",
                link: itemLink ?? "",
                description: itemDescription ?? "",
                pubDate: pubDate ?? ""
            });
        } else {
            for(const it of item){
                const {
                    title: itemTitle,
                    link: itemLink,
                    description: itemDescription,
                    pubDate
                } = it;
                feed.channel.item.push({
                    title: itemTitle ?? "",
                    link: itemLink ?? "",
                    description: itemDescription ?? "",
                    pubDate: pubDate ?? ""
                });
            }
        }
        return feed;
    } catch (error) {
        console.error(error);
        return null;
    }
};