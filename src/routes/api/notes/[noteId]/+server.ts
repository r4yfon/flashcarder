import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// --- Handler for PATCH requests ---
export const PATCH: RequestHandler = async ({ request, params }) => {
    const { noteId } = params;
    let updateData: { title?: string; content?: string }; // Allow updating title or content

    if (!noteId) {
        throw error(400, 'Note ID parameter is missing');
    }

    try {
        const body = await request.json();
        // Basic validation: Ensure at least title or content is provided
        if (typeof body.title === 'undefined' && typeof body.content === 'undefined') {
            throw error(400, 'Request body must contain at least a title or content field to update.');
        }
        updateData = {};
        if (typeof body.title !== 'undefined') {
            // Ensure title is a string, handle empty string case if needed
            updateData.title = String(body.title).trim() || 'Untitled Note';
        }
        if (typeof body.content !== 'undefined') {
            updateData.content = String(body.content);
        }

    } catch (e) {
        // Handle cases where body is not valid JSON or validation fails
        if (e instanceof Error && 'status' in e) throw e; // Re-throw SvelteKit errors
        throw error(400, 'Invalid request body or missing fields');
    }

    try {
        // Add updatedAt timestamp
        const dataToUpdate = {
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const updatedNotes = await db
            .update(notes)
            .set(dataToUpdate)
            .where(eq(notes.id, noteId))
            .returning({
                id: notes.id,
                title: notes.title,
                updatedAt: notes.updatedAt
                // Optionally return content if needed: content: notes.content
            });

        if (updatedNotes.length === 0) {
            throw error(404, 'Note not found');
        }

        return json(updatedNotes[0], { status: 200 });

    } catch (err) {
        console.error('Error updating note:', err);
        // Re-throw SvelteKit errors, otherwise return 500
        if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
            throw err;
        }
        throw error(500, 'Failed to update note');
    }
};

// --- Optional: Add GET and DELETE handlers if needed ---

// export const GET: RequestHandler = async ({ params }) => { ... };
// export const DELETE: RequestHandler = async ({ params }) => { ... };
