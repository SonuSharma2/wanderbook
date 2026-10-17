CREATE TABLE `album_folders` (
	`owner` text NOT NULL,
	`key` text NOT NULL,
	`place` text NOT NULL,
	`country` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`owner`, `key`)
);
