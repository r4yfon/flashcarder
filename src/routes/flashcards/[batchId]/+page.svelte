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
	// Use $: to ensure it re-runs if 'cards' changes (e.g., after deletion)
	$: {
		// Check if showAnswerMap needs initialization or update
		if (cards && cards.length > 0) {
			const newMap = new Map<string, boolean>();
			cards.forEach((card) => {
				if (card.id) {
					// Preserve existing state if card still exists, otherwise default to false
					newMap.set(card.id, showAnswerMap.get(card.id) ?? false);
				}
			});
			showAnswerMap = newMap;
		} else {
			showAnswerMap = new Map<string, boolean>(); // Clear map if no cards
		}
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

			// Remove the card from the local state.
			// The $: block above will handle updating showAnswerMap reactively.
			cards = cards.filter((card) => card.id !== cardId);

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
		// Keep the console logs for debugging if needed
		console.log('toggleAnswer called with cardId:', cardId);

		if (!cardId) {
			console.error('toggleAnswer: cardId is undefined');
			return;
		}

		const currentState = showAnswerMap.get(cardId);
		console.log('Current state for', cardId, ':', currentState);

		const newState = !currentState;
		// Create a new map for reactivity
		const newMap = new Map(showAnswerMap);
		newMap.set(cardId, newState);
		showAnswerMap = newMap; // Trigger reactivity

		console.log('Set new state for', cardId, 'to:', newState);
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
			<!-- Perspective container -->
			<div class="flashcard group perspective relative">
				<!-- Inner rotating container - Apply flip class based on map state -->
				<div
					class="flashcard-inner relative min-h-[240px] cursor-pointer"
					class:flipped={showAnswerMap.get(card.id)}
					role="button"
					tabindex="0"
					on:click={() => toggleAnswer(card.id)}
					on:keydown={(e) => e.key === 'Enter' && toggleAnswer(card.id)}
				>
					<!-- Front (Question) -->
					<div
						class="flashcard-front absolute inset-0 flex flex-col rounded-md border border-indigo-100 bg-indigo-50 p-4"
					>
						<button
							on:click|stopPropagation={() => deleteFlashcard(card.id)}
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
						<p class="mb-2 text-sm font-medium text-indigo-700">Question:</p>
						<!-- Display actual card question -->
						<p
							class="m-auto max-w-[40ch] flex-grow content-evenly text-center text-balance text-indigo-900"
						>
							{card.question}
						</p>
						<!-- Button is now part of the clickable area, but keep for visual cue -->
						<div
							class="absolute right-2 bottom-2 rounded-full p-1 text-indigo-400"
							aria-hidden="true"
						>
							<RefreshCw class="h-4 w-4" />
						</div>
					</div>

					<!-- Back (Answer) -->
					<div
						class="flashcard-back absolute inset-0 flex flex-col rounded-md border border-green-100 bg-green-50 p-4"
					>
						<button
							on:click|stopPropagation={() => deleteFlashcard(card.id)}
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
						<p class="mb-2 text-sm font-medium text-green-700">Answer:</p>
						<!-- Display actual card answer -->
						<p
							class="m-auto max-w-[40ch] flex-grow content-evenly text-center text-balance text-green-900"
						>
							{card.answer}
						</p>
						<!-- Button is now part of the clickable area, but keep for visual cue -->
						<div
							class="absolute right-2 bottom-2 rounded-full p-1 text-green-400"
							aria-hidden="true"
						>
							<RefreshCw class="h-4 w-4" />
						</div>
					</div>
				</div>
			</div>

			<!-- Individual Card Delete Button -->
			<!-- </div> -->
		{/each}
	</div>
</div>

<style>
	/* Ensure perspective is applied */
	.perspective {
		perspective: 1000px;
	}

	/* Inner rotating element */
	.flashcard-inner {
		transition: transform 0.6s;
		transform-style: preserve-3d;
		/* Ensure it fills the perspective container if needed */
		width: 100%;
		height: 100%;
	}

	/* Apply flip transformation */
	.flashcard-inner.flipped {
		transform: rotateY(180deg);
	}

	/* Style front and back, hide the side facing away */
	.flashcard-front,
	.flashcard-back {
		position: absolute;
		width: 100%;
		height: 100%;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden; /* Safari */
		/* Add padding/flex etc. via classes */
	}

	/* Ensure the back starts rotated */
	.flashcard-back {
		transform: rotateY(180deg);
	}
</style>
