CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`file_key` text NOT NULL,
	`file_url` text,
	`user_id` integer,
	`created_at` text DEFAULT '2025-04-14T17:03:53.653Z',
	`updated_at` text DEFAULT '2025-04-14T17:03:53.654Z',
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`note_id` text,
	`document_id` text,
	`user_id` integer,
	`created_at` text DEFAULT '2025-04-14T17:03:53.654Z',
	`updated_at` text DEFAULT '2025-04-14T17:03:53.654Z',
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Untitled Note',
	`content` text NOT NULL,
	`document_id` text,
	`user_id` integer,
	`created_at` text DEFAULT '2025-04-14T17:03:53.654Z',
	`updated_at` text DEFAULT '2025-04-14T17:03:53.654Z',
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`age` integer
);
