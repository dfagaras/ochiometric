CREATE TABLE `daily_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`event` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_metrics_count_positive" CHECK("daily_metrics"."count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_metrics_day_event_unique` ON `daily_metrics` (`day`,`event`);--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limit_buckets_count_positive" CHECK("rate_limit_buckets"."count" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_buckets_key_window_unique` ON `rate_limit_buckets` (`key`,`window_start`);--> statement-breakpoint
CREATE INDEX `rate_limit_buckets_window_idx` ON `rate_limit_buckets` (`window_start`);