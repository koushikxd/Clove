import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const repositoriesTable = pgTable("repositories", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  owner: varchar({ length: 255 }).notNull(),
  url: varchar({ length: 500 }).notNull().unique(),
  description: text(),
  stars: integer().default(0),
  language: varchar({ length: 100 }),
  chunksIndexed: integer().notNull().default(0),
  status: varchar({ length: 50 }).notNull().default("indexed"),
  repoPath: varchar({ length: 500 }),
  indexedAt: timestamp().notNull().defaultNow(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const chatsTable = pgTable("chats", {
  id: varchar({ length: 255 }).primaryKey(),
  repositoryId: varchar({ length: 255 })
    .notNull()
    .references(() => repositoriesTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull().default("New Chat"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: varchar({ length: 255 }).primaryKey(),
  chatId: varchar({ length: 255 })
    .notNull()
    .references(() => chatsTable.id, { onDelete: "cascade" }),
  role: varchar({ length: 20 }).notNull(),
  content: text().notNull(),
  metadata: jsonb(),
  createdAt: timestamp().notNull().defaultNow(),
});
