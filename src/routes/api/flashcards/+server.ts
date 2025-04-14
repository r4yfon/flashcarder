import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notes, flashcards } from '$lib/server/db/schema';
import { generateFlashcards } from '$lib/server/services/ai-service';
import { createDemoUserIfNotExists } from '$lib/server/utils/user-utils';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await createDemoUserIfNotExists();

		const { noteId, count = 5 } = await request.json();

		if (!noteId) {
			return json({ error: 'Note ID is required' }, { status: 400 });
		}
		const note = await db.query.notes.findFirst({ where: eq(notes.id, noteId) });
		if (!note) {
			return json({ error: 'Note not found' }, { status: 404 });
		}
		const content = note.content;
		if (!content) {
			return json({ error: 'Failed to get content from note' }, { status: 400 });
		}

		// Generate flashcards using AI
		const generatedFlashcards = await generateFlashcards(content, count);

		// Generate a unique ID for this batch
		const batchId = uuidv4();

		// Store flashcards in database with the batchId
		const flashcardValues = generatedFlashcards.map((fc) => ({
			id: uuidv4(),
			question: fc.question,
			answer: fc.answer,
			noteId: noteId,
			userId: 1, // Assuming demo user ID
			batchId: batchId // Assign the batch ID
		}));

		if (flashcardValues.length > 0) {
			await db.insert(flashcards).values(flashcardValues);
		}

		// Return the batchId along with the cards
		return json({ batchId: batchId, flashcards: flashcardValues }, { status: 201 });
	} catch (error) {
		console.error('Error generating flashcards:', error);
		if (error instanceof Error && error.message.includes('AI service failed')) {
			return json({ error: error.message }, { status: 502 });
		}
		return json({ error: 'Failed to generate flashcards' }, { status: 500 });
	}
};
