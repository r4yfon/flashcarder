// Flashcard interface - Removed documentId
export interface Flashcard {
	id?: string;
	question: string;
	answer: string;
	noteId?: string; // Keep note association
	userId?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

// Note interface - Removed documentId
export interface Note {
	id?: string;
	title?: string;
	content: string;
	userId?: number;
	createdAt?: Date;
	updatedAt?: Date;
	// Optional: If you still fetch related flashcards with notes
	flashcards?: Flashcard[];
}
