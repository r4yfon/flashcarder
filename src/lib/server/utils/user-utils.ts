import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

// Create a demo user for development
export async function createDemoUserIfNotExists() {
	try {
		// Check if user with ID 1 exists
		const existingUser = await db.query.user.findFirst({
			where: (user, { eq }) => eq(user.id, 1)
		});

		if (!existingUser) {
			console.log('Creating demo user with ID 1...');
			await db.insert(user).values({
				id: 1,
				username: 'demo_user' // Ensure username is provided
			});
			console.log('Demo user created successfully.');
		}
	} catch (error) {
		console.error('Error creating demo user:', error);
	}
}
