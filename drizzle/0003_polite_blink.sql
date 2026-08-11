CREATE TABLE `attempt_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempt_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`guess` real NOT NULL,
	`factor` real NOT NULL,
	`locked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "attempt_answers_guess_positive" CHECK("attempt_answers"."guess" > 0),
	CONSTRAINT "attempt_answers_factor_valid" CHECK("attempt_answers"."factor" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_answers_attempt_question_unique` ON `attempt_answers` (`attempt_id`,`question_id`);