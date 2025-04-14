import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all notes from the database, ordered by creation date descending
		const allNotes = await db.query.notes.findMany({
			orderBy: (notes, { desc }) => [desc(notes.createdAt)]
			// You can add 'with' here if you need related data later
			// with: {
			//   user: true // Example
			// }
		});

		// Return the notes. They will be available as `data.notes` in +page.svelte
		return {
			notes: allNotes
		};
	} catch (err) {
		console.error('Error fetching notes:', err);
		// Throw a SvelteKit error to display an error page
		throw error(500, 'Failed to fetch notes');
	}
};
