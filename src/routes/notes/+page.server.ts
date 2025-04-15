import { db } from '$lib/server/db';
import { notes, flashcards } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Define an extended Note type for the load function's return value
type NoteWithBatch = App.Note & { batchId?: string | null };

export const load: PageServerLoad = async () => {
    try {
        // Subquery to get the latest batchId for each noteId
        // Assuming batchId is consistent for a generation linked to a noteId
        // and we just need *any* batchId associated with the note.
        // If multiple batches per note are possible, you might need `max(createdAt)` logic.
        const sq = db
            .select({
                noteId: flashcards.noteId,
                // Use sql`max` if you need the *latest* batch, otherwise just getting one is fine
                batchId: sql<string>`max(${flashcards.batchId})`.as('batchId')
            })
            .from(flashcards)
            .groupBy(flashcards.noteId)
            .as('fc');

        // Fetch notes and left join with the subquery to get batchId
        const notesData: NoteWithBatch[] = await db
            .select({
                id: notes.id,
                title: notes.title,
                content: notes.content,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
                batchId: sq.batchId // Get batchId from the subquery join
            })
            .from(notes)
            .leftJoin(sq, eq(notes.id, sq.noteId)) // Join notes with the flashcard batch subquery
            .orderBy(desc(notes.createdAt)); // Order notes by creation date

        return {
            notes: notesData
        };
    } catch (error) {
        console.error('Error loading notes:', error);
        // Optionally return an error state to the page
        return {
            notes: [],
            error: 'Failed to load notes.'
        };
    }
};
