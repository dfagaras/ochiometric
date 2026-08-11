CREATE TABLE `admin_users` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `puzzle_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`puzzle_id` integer NOT NULL,
	`admin_email` text NOT NULL,
	`action` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`admin_email`) REFERENCES `admin_users`(`email`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "puzzle_audit_log_action_valid" CHECK("puzzle_audit_log"."action" IN ('created', 'updated', 'scheduled', 'published', 'archived'))
);
--> statement-breakpoint
CREATE INDEX `puzzle_audit_log_puzzle_idx` ON `puzzle_audit_log` (`puzzle_id`,`created_at`);