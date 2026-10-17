CREATE TABLE `album_shares` (
	`token` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`key` text NOT NULL,
	`place` text NOT NULL,
	`country` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `album_shares_owner_key_idx` ON `album_shares` (`owner`,`key`);