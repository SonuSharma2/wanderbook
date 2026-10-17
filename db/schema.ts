import { sqliteTable, text, integer, index, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('entries', {
 id: text('id').primaryKey(), owner: text('owner').notNull(),
 data: text('data').notNull(), updated: text('updated').notNull(),
}, table => [index('entries_owner_idx').on(table.owner)]);
export const albumFolders = sqliteTable('album_folders', {
 owner: text('owner').notNull(), key: text('key').notNull(),
 place: text('place').notNull(), country: text('country').notNull(),
 created: text('created').notNull(),
}, table => [primaryKey({columns:[table.owner,table.key]})]);
export const albumShares = sqliteTable('album_shares', {
 token: text('token').primaryKey(), owner: text('owner').notNull(),
 key: text('key').notNull(), place: text('place').notNull(), country: text('country').notNull(),
 enabled: integer('enabled').notNull().default(1), created: text('created').notNull(),
}, table => [uniqueIndex('album_shares_owner_key_idx').on(table.owner,table.key)]);
