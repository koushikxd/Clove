import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
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
  indexedAt: timestamp().notNull().defaultNow(),
  createdAt: timestamp().notNull().defaultNow(),
});
