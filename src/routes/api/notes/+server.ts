import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notes, flashcards } from '$lib/server/db/schema';
import { createDemoUserIfNotExists } from '$lib/server/utils/user-utils';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await createDemoUserIfNotExists();

		const { title, content } = await request.json();

		if (!content) {
			return json({ error: 'Content is required' }, { status: 400 });
		}

		const [note] = await db
			.insert(notes)
			.values({
				id: uuidv4(),
				title: title || 'Untitled Note',
				content,
				userId: 1 // Assuming demo user ID
			})
			.returning();

		return json({ note }, { status: 201 });
	} catch (error) {
		console.error('Error creating note:', error);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		const allNotes = await db.query.notes.findMany({
			orderBy: (notes, { desc }) => [desc(notes.createdAt)]
		});

		return json({ notes: allNotes });
	} catch (error) {
		console.error('Error fetching notes:', error);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'Note ID is required' }, { status: 400 });
		}

		await db.transaction(async (tx) => {
			await tx.delete(flashcards).where(eq(flashcards.noteId, id));

			const result = await tx.delete(notes).where(eq(notes.id, id)).returning();

			if (result.length === 0) {
				throw new Error('Note not found');
			}
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting note:', error);
		if (error instanceof Error && error.message === 'Note not found') {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
};
