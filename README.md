# FlashCarder

FlashCarder is a web application that allows users to create study notes and automatically generate flashcards from them using AI. Write or upload your notes, and let the AI help you create effective study materials.

## Key Features

- **Create Notes:** Write notes directly in the application using a simple editor.
- **Markdown Upload:** Drag and drop Markdown (.md) files to import notes quickly.
- **AI Flashcard Generation:** Automatically generate flashcards from your note content using an AI service (OpenRouter/Gemini).
- **View & Manage Notes:** See a list of all your notes, view individual notes, and delete them.
- **View & Manage Flashcards:** Flashcards are grouped by generation batch. View batches, flip cards between question and answer, and delete individual cards or entire batches.
- **Note Linking:** Flashcard batches link back to the original note they were generated from.

## Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (with [Typography plugin](https://tailwindcss.com/docs/typography-plugin))
- **Database:** [SQLite](https://www.sqlite.org/index.html)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **AI Service:** [OpenRouter API](https://openrouter.ai/) (using Google Gemini Flash model)
- **Icons:** [Lucide Svelte](https://lucide.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Linting/Formatting:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd flashcarder
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or pnpm install or yarn install
    ```
3.  **Set up environment variables:**
    - Copy the example environment file: `cp .env.example .env`
    - Edit the `.env` file and add your `OPENROUTER_API_KEY`. You might also want to set `APP_URL` if deploying or running on a specific domain/port.
    ```env
    # .env
    OPENROUTER_API_KEY="your_openrouter_api_key_here"
    APP_URL="http://localhost:5173" # Optional: Update if needed
    ```
4.  **Initialize and migrate the database:**
    - The project uses a demo user (ID 1) created automatically.
    - Apply database schema changes:
    ```bash
    npm run db:push
    # or npm run db:migrate if you prefer migration files
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or the configured port).

## Available Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm run preview`: Preview the production build locally.
- `npm run check`: Run Svelte check and TypeScript checks.
- `npm run lint`: Run ESLint and Prettier checks.
- `npm run format`: Format the codebase using Prettier.
- `npm run db:push`: Push schema changes directly to the database (development).
- `npm run db:migrate`: Generate SQL migration files based on schema changes.
- `npm run db:studio`: Open Drizzle Studio to browse the database.
