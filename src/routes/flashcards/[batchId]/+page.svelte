<!-- filepath: c:\Users\GRAM\Documents\GitHub\flashcarder\src\routes\flashcards\[batchId]\+page.svelte -->
<script lang="ts">
	import { Trash2, RefreshCw, ArrowLeft } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/formatters';
	import type { PageData } from './$types';

	export let data: PageData; // Data from the load function

	let batch = data.batch;
	let cards = data.cards;
	let error = ''; // For deletion errors on this page

	let deletingCardId: string | null = null;

	// State for card flipping: Map<cardId, showAnswer>
	let showAnswerMap = new Map<string, boolean>();

	// Initialize map when cards data is available
	$: {
		showAnswerMap = new Map<string, boolean>();
		cards.forEach((card) => {
			if (card.id) {
				showAnswerMap.set(card.id, false); // Start showing question
			}
		});
	}

	// --- Individual Card Deletion ---
	async function deleteFlashcard(cardId: string | undefined) {
		if (!cardId) return;
		if (!confirm('Are you sure you want to delete this flashcard?')) return;

		deletingCardId = cardId;
		error = ''; // Clear previous errors
		try {
			const response = await fetch(`/api/flashcards/${cardId}`, { method: 'DELETE' });
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete flashcard');
			}

			// Remove the card from the local state and the answer map
			showAnswerMap.delete(cardId);
			cards = cards.filter((card) => card.id !== cardId);
			// Optionally update batch card count if displayed, or navigate if empty
			if (cards.length === 0) {
				alert('Last card deleted. Returning to flashcard list.');
				window.location.href = '/flashcards'; // Simple redirect
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during card deletion';
		} finally {
			deletingCardId = null;
		}
	}

	// --- Toggle Card Answer ---
	function toggleAnswer(cardId: string | undefined) {
		console.log('toggleAnswer called with cardId:', cardId); // Log 1: Function called?

		if (!cardId) {
			console.error('toggleAnswer: cardId is undefined');
			return;
		}

		const currentState = showAnswerMap.get(cardId);
		console.log('Current state for', cardId, ':', currentState); // Log 2: What's the current state?

		const newState = !currentState;
		showAnswerMap.set(cardId, newState);
		console.log('Set new state for', cardId, 'to:', newState); // Log 3

		// Force reactivity update by creating a NEW map
		showAnswerMap = new Map(showAnswerMap); // <--- CHANGE THIS LINE
		console.log('New Map created for reactivity'); // Log 4 updated

		// Optional: Check the map directly after update
		console.log('State in new map after update:', showAnswerMap.get(cardId));
	}
</script>

<div class="mx-auto max-w-3xl">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<a
				href="/flashcards"
				class="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
			>
				<ArrowLeft class="mr-1 h-4 w-4" />
				Back to Batches
			</a>
			<h1 class="text-2xl font-bold text-gray-900">
				Flashcards from: {batch.noteTitle || 'Unknown Note'}
				{#if batch.noteId}
					<a
						href="/notes/{batch.noteId}"
						title="View Note"
						class="ml-2 text-indigo-600 hover:text-indigo-800">🔗</a
					>
				{/if}
			</h1>
			<p class="text-sm text-gray-500">Generated {formatDate(batch.createdAt)}</p>
		</div>
		<!-- Maybe add batch-level actions here later -->
	</div>

	<!-- Deletion Error Display -->
	{#if error}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
			{error}
		</div>
	{/if}

	<!-- Card List -->
	<div class="space-y-6">
		{#each cards as card (card.id)}
			<div class="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
				<p class="absolute top-0 left-0 bg-yellow-200 text-xs">
					Flipped: {showAnswerMap.get(card.id)}
				</p>
				<div class="flashcard group perspective {showAnswerMap.get(card.id) ? 'flipped' : ''}">
					<div class="flashcard-inner relative min-h-[120px]">
						<!-- {/* Front (Question) */} -->
						<div
							class="flashcard-front absolute inset-0 flex flex-col rounded-md border border-indigo-100 bg-indigo-50 p-4"
						>
							<p class="mb-2 text-sm font-medium text-indigo-700">Question:</p>
							<p class="flex-grow text-indigo-900">{card.question}</p>
							<button
								onclick={() => toggleAnswer(card.id)}
								title="Flip card"
								class="absolute right-2 bottom-2 rounded-full p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none"
							>
								<RefreshCw class="h-4 w-4" />
							</button>
						</div>
						<!-- {/* Back (Answer) */} -->
						<div
							class="flashcard-back absolute inset-0 flex flex-col rounded-md border border-green-100 bg-green-50 p-4"
						>
							<p class="mb-2 text-sm font-medium text-green-700">Answer:</p>
							<p class="flex-grow text-green-900">{card.answer}</p>
							<button
								onclick={() => toggleAnswer(card.id)}
								title="Flip card"
								class="absolute right-2 bottom-2 rounded-full p-1 text-green-400 hover:bg-green-100 hover:text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:outline-none"
							>
								<RefreshCw class="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
				<!-- {/* Individual Card Delete Button */} -->
				<button
					onclick={() => deleteFlashcard(card.id)}
					disabled={deletingCardId === card.id}
					title="Delete this card"
					class="absolute top-2 right-2 z-10 rounded-md p-1 text-gray-400 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if deletingCardId === card.id}
						<svg
							class="h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							><circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle><path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path></svg
						>
					{:else}
						<Trash2 class="h-4 w-4" />
					{/if}
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Keep the flip animation styles */
	.flashcard-inner {
		transition: transform 0.6s;
		transform-style: preserve-3d;
	}
	.flashcard.flipped .flashcard-inner {
		transform: rotateY(180deg);
	}
	.flashcard-front,
	.flashcard-back {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden; /* Safari */
	}
	.flashcard-back {
		transform: rotateY(180deg);
	}
</style>
