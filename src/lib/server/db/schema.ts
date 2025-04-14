import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// User table (assuming this is still needed for potential future auth)
export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	username: text('username').unique().notNull(),
	createdAt: text('created_at').default(String(new Date().toISOString()))
});

// Notes table - Removed documentId
export const notes = sqliteTable('notes', {
	id: text('id').primaryKey().notNull(),
	title: text('title').default('Untitled Note'),
	content: text('content').notNull(),
	userId: integer('user_id').references(() => user.id), // Keep if user association is desired
	createdAt: text('created_at').default(String(new Date().toISOString())),
	updatedAt: text('updated_at').default(String(new Date().toISOString()))
});

// Flashcards table - Add batchId
export const flashcards = sqliteTable('flashcards', {
	id: text('id').primaryKey().notNull(),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	noteId: text('note_id').references(() => notes.id), // Keep note association
	userId: integer('user_id').references(() => user.id), // Keep if user association is desired
	batchId: text('batch_id').notNull(), // Added: To group generated cards
	createdAt: text('created_at').default(String(new Date().toISOString())),
	updatedAt: text('updated_at').default(String(new Date().toISOString()))
});

// Relations - Removed documentsRelations and references from notes/flashcards
export const userRelations = relations(user, ({ many }) => ({
	notes: many(notes),
	flashcards: many(flashcards)
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
	user: one(user, {
		fields: [notes.userId],
		references: [user.id]
	}),
	flashcards: many(flashcards)
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
	user: one(user, {
		fields: [flashcards.userId],
		references: [user.id]
	}),
	note: one(notes, {
		fields: [flashcards.noteId],
		references: [notes.id]
	})
}));
