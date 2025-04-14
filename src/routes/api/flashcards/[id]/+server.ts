// filepath: src/routes/api/flashcards/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { flashcards } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id) {
		return json({ error: 'Flashcard ID is required' }, { status: 400 });
	}

	try {
		const result = await db.delete(flashcards).where(eq(flashcards.id, id)).returning();

		if (result.length === 0) {
			return json({ error: 'Flashcard not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting flashcard:', error);
		return json({ error: 'Failed to delete flashcard' }, { status: 500 });
	}
};
