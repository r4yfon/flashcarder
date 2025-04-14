import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const noteId = params.id;

	if (!noteId) {
		throw error(400, 'Note ID is required'); // Should not happen with route structure
	}

	try {
		const note = await db.query.notes.findFirst({
			where: eq(notes.id, noteId)
			// Optionally include related data if needed later
			// with: {
			//   flashcards: true
			// }
		});

		if (!note) {
			// This is the crucial part: if the note isn't found in the DB, throw a 404
			throw error(404, 'Note not found');
		}

		// Return the found note. This will be available as `data.note` in +page.svelte
		return {
			note: note
		};
	} catch (err) {
		// Catch database errors or the 404 error from above
		if (err.status === 404) {
			throw err; // Re-throw the SvelteKit error
		}
		console.error('Error fetching note:', err);
		throw error(500, 'Failed to fetch note');
	}
};
