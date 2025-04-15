import { db } from '$lib/server/db';
import { flashcards } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    const { batchId } = params;

    if (!batchId) {
        throw error(400, 'Batch ID parameter is missing');
    }

    try {
        const result = await db
            .delete(flashcards)
            .where(eq(flashcards.batchId, batchId))
            .returning({ id: flashcards.id }); // Return deleted IDs

        if (result.length === 0) {
            // It's okay if the batch didn't exist or was already deleted
            console.log(`No flashcards found for batchId ${batchId} to delete, or already deleted.`);
        } else {
            console.log(`Deleted ${result.length} flashcards for batchId ${batchId}.`);
        }

        return json({ message: `Successfully processed deletion for batch ${batchId}. Deleted count: ${result.length}` }, { status: 200 });

    } catch (err) {
        console.error(`Error deleting flashcards for batch ${batchId}:`, err);
        throw error(500, 'Failed to delete flashcard batch');
    }
};
