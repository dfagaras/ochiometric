ALTER TABLE `attempts` ADD `public_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `attempts_public_id_unique` ON `attempts` (`public_id`);
