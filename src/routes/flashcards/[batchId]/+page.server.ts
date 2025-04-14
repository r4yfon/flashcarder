// filepath: c:\Users\GRAM\Documents\GitHub\flashcarder\src\routes\flashcards\[batchId]\+page.server.ts
import { db } from '$lib/server/db';
import { flashcards } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { Flashcard, Note } from '$lib/types';

interface FlashcardWithNote extends Flashcard {
    note: Pick<Note, 'id' | 'title'> | null;
}

export const load: PageServerLoad = async ({ params }) => {
    const batchId = params.batchId;

    if (!batchId) {
        throw error(400, 'Batch ID is required');
    }

    try {
        const batchCards = await db.query.flashcards.findMany({
            where: eq(flashcards.batchId, batchId),
            orderBy: [desc(flashcards.createdAt)], // Optional: order cards within batch
            with: {
                note: {
                    columns: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!batchCards || batchCards.length === 0) {
            throw error(404, 'Flashcard batch not found');
        }

        // Extract batch info from the first card (assuming all cards in batch share note/creation time)
        const firstCard = batchCards[0];
        const batchInfo = {
            batchId: batchId,
            noteId: firstCard.noteId ?? null,
            noteTitle: firstCard.note?.title ?? 'Unknown Note',
            createdAt: firstCard.createdAt ?? new Date().toISOString()
        };

        // Remove the nested note object from individual cards for cleaner structure
        const cleanedCards = batchCards.map(({ note, ...card }) => card);

        return {
            batch: batchInfo,
            cards: cleanedCards
        };
    } catch (err) {
        if (err.status === 404) {
            throw err; // Re-throw SvelteKit 404 error
        }
        console.error('Error fetching flashcard batch:', err);
        throw error(500, 'Failed to fetch flashcard batch');
    }
};
