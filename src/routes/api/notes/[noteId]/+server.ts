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

// --- Handler for DELETE requests ---
export const DELETE: RequestHandler = async ({ params }) => {
	const { noteId } = params;

	if (!noteId) {
		throw error(400, 'Note ID parameter is missing');
	}

	try {
		await db.transaction(async (tx) => {
			// Delete the note itself
			const deletedNotes = await tx
				.delete(notes)
				.where(eq(notes.id, noteId))
				.returning({ id: notes.id });

			if (deletedNotes.length === 0) {
				throw error(404, 'Note not found');
			}
		});

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('Error deleting note:', err);

		// Check for SvelteKit HTTP errors first (like the 404 we threw)
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
			throw err;
		}

		// Check specifically for the Foreign Key constraint error
		// Drizzle wraps the original error, so we check the 'code' property if it exists
		if (err instanceof Error && 'code' in err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
			throw error(
				409, // 409 Conflict is suitable here
				'Cannot delete this note because it has associated flashcards. Please delete the flashcards first.'
			);
		}

		// Generic fallback error
		throw error(500, 'Failed to delete note due to an unexpected error.');
	}
};

// --- Optional: Add GET handler if needed ---
// export const GET: RequestHandler = async ({ params }) => { ... };
