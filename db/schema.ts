import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const puzzleStatuses = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

export const puzzles = sqliteTable(
  "puzzles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    edition: integer("edition").notNull(),
    publishDate: text("publish_date").notNull(),
    status: text("status", { enum: puzzleStatuses }).notNull().default("draft"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("puzzles_edition_unique").on(table.edition),
    uniqueIndex("puzzles_publish_date_unique").on(table.publishDate),
    index("puzzles_status_publish_date_idx").on(table.status, table.publishDate),
    check("puzzles_edition_positive", sql`${table.edition} > 0`),
    check(
      "puzzles_publish_date_iso",
      sql`strftime('%Y-%m-%d', ${table.publishDate}) IS NOT NULL AND ${table.publishDate} = strftime('%Y-%m-%d', ${table.publishDate})`,
    ),
    check(
      "puzzles_status_valid",
      sql`${table.status} IN ('draft', 'scheduled', 'published', 'archived')`,
    ),
  ],
);

export const questions = sqliteTable(
  "questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puzzleId: integer("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    answer: real("answer").notNull(),
    unit: text("unit").notNull(),
    explanation: text("explanation").notNull(),
    sourceLabel: text("source_label").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    napkinMath: text("napkin_math").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("questions_puzzle_position_unique").on(
      table.puzzleId,
      table.position,
    ),
    index("questions_puzzle_idx").on(table.puzzleId),
    check(
      "questions_position_valid",
      sql`${table.position} BETWEEN 1 AND 3`,
    ),
    check("questions_answer_positive", sql`${table.answer} > 0`),
    check("questions_prompt_not_empty", sql`length(trim(${table.prompt})) > 0`),
    check("questions_unit_not_empty", sql`length(trim(${table.unit})) > 0`),
    check(
      "questions_explanation_not_empty",
      sql`length(trim(${table.explanation})) > 0`,
    ),
  ],
);

export const anonymousPlayers = sqliteTable("anonymous_players", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const attempts = sqliteTable(
  "attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: text("player_id")
      .notNull()
      .references(() => anonymousPlayers.id, { onDelete: "cascade" }),
    puzzleId: integer("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
    score: real("score"),
    publicId: text("public_id"),
  },
  (table) => [
    uniqueIndex("attempts_player_puzzle_unique").on(
      table.playerId,
      table.puzzleId,
    ),
    index("attempts_puzzle_idx").on(table.puzzleId),
    uniqueIndex("attempts_public_id_unique").on(table.publicId),
    check(
      "attempts_completion_valid",
      sql`(${table.completedAt} IS NULL AND ${table.score} IS NULL) OR (${table.completedAt} IS NOT NULL AND ${table.score} >= 1)`,
    ),
  ],
);

export const attemptAnswers = sqliteTable(
  "attempt_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    questionId: integer("question_id").notNull().references(() => questions.id),
    guess: real("guess").notNull(),
    factor: real("factor").notNull(),
    lockedAt: text("locked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("attempt_answers_attempt_question_unique").on(table.attemptId, table.questionId),
    check("attempt_answers_guess_positive", sql`${table.guess} > 0`),
    check("attempt_answers_factor_valid", sql`${table.factor} >= 1`),
  ],
);

export const adminUsers = sqliteTable("admin_users", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const puzzleAuditLog = sqliteTable(
  "puzzle_audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    puzzleId: integer("puzzle_id").notNull().references(() => puzzles.id, { onDelete: "cascade" }),
    adminEmail: text("admin_email").notNull().references(() => adminUsers.email),
    action: text("action", { enum: ["created", "updated", "scheduled", "published", "archived"] }).notNull(),
    details: text("details").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("puzzle_audit_log_puzzle_idx").on(table.puzzleId, table.createdAt),
    check("puzzle_audit_log_action_valid", sql`${table.action} IN ('created', 'updated', 'scheduled', 'published', 'archived')`),
  ],
);

export const dailyMetrics = sqliteTable(
  "daily_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    day: text("day").notNull(),
    event: text("event").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("daily_metrics_day_event_unique").on(table.day, table.event),
    check("daily_metrics_count_positive", sql`${table.count} >= 0`),
  ],
);

export const rateLimitBuckets = sqliteTable(
  "rate_limit_buckets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [
    uniqueIndex("rate_limit_buckets_key_window_unique").on(table.key, table.windowStart),
    index("rate_limit_buckets_window_idx").on(table.windowStart),
    check("rate_limit_buckets_count_positive", sql`${table.count} > 0`),
  ],
);

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: text("day").notNull(),
  score: real("score").notNull(),
  createdAt: text("created_at").notNull(),
});
