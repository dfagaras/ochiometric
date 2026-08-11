CREATE TABLE `puzzles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`edition` integer NOT NULL,
	`publish_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "puzzles_edition_positive" CHECK("puzzles"."edition" > 0),
	CONSTRAINT "puzzles_publish_date_iso" CHECK(strftime('%Y-%m-%d', "puzzles"."publish_date") IS NOT NULL AND "puzzles"."publish_date" = strftime('%Y-%m-%d', "puzzles"."publish_date")),
	CONSTRAINT "puzzles_status_valid" CHECK("puzzles"."status" IN ('draft', 'scheduled', 'published', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `puzzles_edition_unique` ON `puzzles` (`edition`);--> statement-breakpoint
CREATE UNIQUE INDEX `puzzles_publish_date_unique` ON `puzzles` (`publish_date`);--> statement-breakpoint
CREATE INDEX `puzzles_status_publish_date_idx` ON `puzzles` (`status`,`publish_date`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`puzzle_id` integer NOT NULL,
	`position` integer NOT NULL,
	`prompt` text NOT NULL,
	`answer` real NOT NULL,
	`unit` text NOT NULL,
	`explanation` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "questions_position_valid" CHECK("questions"."position" BETWEEN 1 AND 3),
	CONSTRAINT "questions_answer_positive" CHECK("questions"."answer" > 0),
	CONSTRAINT "questions_prompt_not_empty" CHECK(length(trim("questions"."prompt")) > 0),
	CONSTRAINT "questions_unit_not_empty" CHECK(length(trim("questions"."unit")) > 0),
	CONSTRAINT "questions_explanation_not_empty" CHECK(length(trim("questions"."explanation")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questions_puzzle_position_unique` ON `questions` (`puzzle_id`,`position`);--> statement-breakpoint
CREATE INDEX `questions_puzzle_idx` ON `questions` (`puzzle_id`);