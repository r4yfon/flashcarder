import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { flashcards } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';
import { desc } from 'drizzle-orm'; // Import desc
import type { Flashcard, Note } from '$lib/types'; // Import Note type

interface FlashcardWithNote extends Flashcard {
	note: Pick<Note, 'id' | 'title'> | null; // Include note title
}

interface FlashcardBatch {
	batchId: string;
	noteId: string | null;
	noteTitle: string | null;
	createdAt: string; // Timestamp of the first card in the batch
	cards: Flashcard[];
}

export const GET: RequestHandler = async () => {
	try {
		const allFlashcardsRaw = await db.query.flashcards.findMany({
			orderBy: (flashcards, { desc }) => [desc(flashcards.createdAt)], // Order to get latest batches first
			with: {
				note: {
					// Include related note data
					columns: {
						id: true,
						title: true
					}
				}
			}
		});

		// Group flashcards by batchId
		const batchesMap = new Map<string, FlashcardBatch>();

		for (const card of allFlashcardsRaw) {
			const batchId = card.batchId;
			if (!batchesMap.has(batchId)) {
				batchesMap.set(batchId, {
					batchId: batchId,
					noteId: card.noteId ?? null,
					noteTitle: card.note?.title ?? 'Unknown Note',
					createdAt: card.createdAt ?? new Date().toISOString(), // Use first card's timestamp
					cards: []
				});
			}
			// Add card, removing the nested note object for cleaner structure
			const { note, ...cardWithoutNote } = card;
			batchesMap.get(batchId)?.cards.push(cardWithoutNote);
		}

		// Convert map values to an array
		const batchesArray = Array.from(batchesMap.values());

		// Sort batches by createdAt descending (latest first)
		batchesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return json({ batches: batchesArray });
	} catch (error) {
		console.error('Error fetching flashcards:', error);
		return json({ error: 'Failed to fetch flashcards' }, { status: 500 });
	}
};
