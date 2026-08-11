CREATE TABLE `anonymous_players` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`puzzle_id` integer NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`score` real,
	FOREIGN KEY (`player_id`) REFERENCES `anonymous_players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "attempts_completion_valid" CHECK(("attempts"."completed_at" IS NULL AND "attempts"."score" IS NULL) OR ("attempts"."completed_at" IS NOT NULL AND "attempts"."score" >= 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempts_player_puzzle_unique` ON `attempts` (`player_id`,`puzzle_id`);--> statement-breakpoint
CREATE INDEX `attempts_puzzle_idx` ON `attempts` (`puzzle_id`);