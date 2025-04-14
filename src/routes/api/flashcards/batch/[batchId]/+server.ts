import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { flashcards } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params }) => {
	const { batchId } = params;

	if (!batchId) {
		return json({ error: 'Batch ID is required' }, { status: 400 });
	}

	try {
		// Delete all flashcards matching the batchId
		const result = await db.delete(flashcards).where(eq(flashcards.batchId, batchId)).returning();

		if (result.length === 0) {
			// It's okay if the batch was already deleted, maybe return success?
			// Or return 404 if you want to be strict.
			console.warn(`Attempted to delete non-existent or empty batch: ${batchId}`);
			// return json({ error: 'Batch not found or already empty' }, { status: 404 });
		}

		return json({ success: true, count: result.length });
	} catch (error) {
		console.error(`Error deleting flashcard batch ${batchId}:`, error);
		return json({ error: 'Failed to delete flashcard batch' }, { status: 500 });
	}
};
