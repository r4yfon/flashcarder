import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	out: './drizzle',
	dbCredentials: {
		url: './dev.db'
	},
	verbose: true,
	strict: true
});
