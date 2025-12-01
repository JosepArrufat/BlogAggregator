import {pgTable, timestamp, uuid, text, unique} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated-at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    name: text("name").notNull().unique(),
});
export type User = typeof users.$inferSelect;

export const feeds = pgTable("feeds", {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated-at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    user_id: uuid("user_id").notNull()  
        .references(() => users.id, {onDelete: "cascade"}),
    last_fetched_at: timestamp("last-fetched-at").$onUpdate(() => new Date()),
});

export type Feed = typeof feeds.$inferSelect;


export const feed_follows = pgTable("feed_follows", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    feed_id: uuid("feed_id").notNull().references(() => feeds.id, {onDelete: "cascade"}),
}, (table) => [
    unique("unique_user_feed").on(table.user_id, table.feed_id)
]);

export const posts = pgTable("posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated-at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    description: text("description").notNull(),
    publishedAt: timestamp("published-at").notNull(),
    feed_id: uuid("feed_id").notNull().references(() => feeds.id, {onDelete: "cascade"}),
});