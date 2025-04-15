import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFlashcardsFromNote } from '$lib/server/openai';
import { db } from '$lib/server/db';
import { notes, flashcards as flashcardsTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request }) => {
    const { noteId, count = 5 } = await request.json(); // Default to 5 if count not provided

    if (!noteId) {
        throw error(400, 'Note ID is required');
    }

    if (typeof count !== 'number' || count < 1 || count > 50) {
        throw error(400, 'Invalid count. Must be a number between 1 and 50.');
    }

    try {
        // 1. Fetch the note content
        const noteResult = await db.select({ content: notes.content }).from(notes).where(eq(notes.id, noteId));

        if (!noteResult || noteResult.length === 0) {
            throw error(404, 'Note not found');
        }
        const noteContent = noteResult[0].content;

        if (!noteContent) {
            throw error(400, 'Note content is empty');
        }

        // 2. Generate flashcards using AI
        const generatedFlashcards = await generateFlashcardsFromNote(noteContent, count);

        if (!generatedFlashcards || generatedFlashcards.length === 0) {
            throw error(500, 'AI failed to generate flashcards or returned empty result');
        }

        // 3. Prepare flashcards for insertion with a unique batch ID
        const batchId = nanoid(); // Generate a unique ID for this batch
        const flashcardsToInsert = generatedFlashcards.map((fc) => ({
            id: nanoid(), // Generate unique ID for each flashcard
            noteId: noteId,
            batchId: batchId, // Assign the same batch ID to all cards in this generation
            question: fc.question,
            answer: fc.answer,
            createdAt: new Date().toISOString(), // Add timestamp
            updatedAt: new Date().toISOString()
        }));

        // 4. Insert flashcards into the database
        await db.insert(flashcardsTable).values(flashcardsToInsert);

        // 5. Return the generated flashcards AND the batchId
        return json(
            {
                flashcards: generatedFlashcards, // Keep returning cards for potential future use? Or remove?
                batchId: batchId // *** ADDED batchId ***
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('Error generating flashcards:', err);
        // Check if it's a SvelteKit error and re-throw
        if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
            throw err;
        }
        // Otherwise, throw a generic 500 error
        throw error(500, err instanceof Error ? err.message : 'Failed to generate flashcards');
    }
};
