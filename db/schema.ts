import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('entries', {
 id: text('id').primaryKey(), owner: text('owner').notNull(),
 data: text('data').notNull(), updated: text('updated').notNull(),
}, table => [index('entries_owner_idx').on(table.owner)]);
export const albumFolders = sqliteTable('album_folders', {
 owner: text('owner').notNull(), key: text('key').notNull(),
 place: text('place').notNull(), country: text('country').notNull(),
 created: text('created').notNull(),
}, table => [primaryKey({columns:[table.owner,table.key]})]);
