<script lang="ts">
	import { onMount } from 'svelte';
	// Icons needed: Layers, Trash2, ArrowRight (or similar for link indication)
	import { Layers, Trash2, ArrowRight } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/formatters';

	// Simplified Batch type for the list view
	interface FlashcardBatchSummary {
		batchId: string;
		noteId: string | null;
		noteTitle: string | null;
		createdAt: string;
		cardCount: number; // Just need the count here
	}

	let batches: FlashcardBatchSummary[] = [];
	let loading = true;
	let error = '';

	let deletingBatchId: string | null = null;

	onMount(async () => {
		try {
			const response = await fetch('/api/flashcards/list'); // API endpoint remains the same
			if (!response.ok) {
				throw new Error('Failed to fetch flashcard batches');
			}
			const data = await response.json();
			// Map API response to the simplified summary type
			batches = (data.batches || []).map((batch: any) => ({
				batchId: batch.batchId,
				noteId: batch.noteId,
				noteTitle: batch.noteTitle,
				createdAt: batch.createdAt,
				cardCount: batch.cards?.length || 0
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	});

	// --- Batch Deletion (remains on this page) ---
	async function deleteBatch(batchId: string | undefined) {
		if (!batchId) return;
		if (!confirm('Are you sure you want to delete this entire batch of flashcards?')) return;

		deletingBatchId = batchId;
		try {
			const response = await fetch(`/api/flashcards/batch/${batchId}`, { method: 'DELETE' });
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete flashcard batch');
			}
			// Remove the batch from the local state
			batches = batches.filter((batch) => batch.batchId !== batchId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during batch deletion';
		} finally {
			deletingBatchId = null;
		}
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Flashcard Batches</h1>
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
			></div>
			<p class="text-gray-500">Loading flashcard batches...</p>
		</div>
	{:else if error}
		<div class="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
			<p class="text-red-800">{error}</p>
		</div>
	{:else if batches.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white py-12 text-center">
			<Layers class="mx-auto mb-4 h-12 w-12 text-gray-400" />
			<h3 class="mb-2 text-lg font-medium text-gray-900">No flashcard batches found</h3>
			<p class="mb-4 text-gray-500">Generate your first flashcards from your notes.</p>
			<div class="flex justify-center space-x-4">
				<a
					href="/notes/new"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					Create Notes
				</a>
			</div>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			<ul role="list" class="divide-y divide-gray-200">
				{#each batches as batch (batch.batchId)}
					<li class="group relative hover:bg-gray-50">
						<a href="/flashcards/{batch.batchId}" class="block p-4 sm:p-6">
							<div class="flex items-center justify-between">
								<div class="flex-grow pr-4">
									<h2 class="truncate text-lg font-medium text-gray-900">
										Batch from: {batch.noteTitle || 'Unknown Note'}
										{#if batch.noteId}
											<span
												title="View Note"
												class="ml-2 text-indigo-600 group-hover:text-indigo-800">🔗</span
											>
										{/if}
									</h2>
									<p class="text-sm text-gray-500">
										Generated {formatDate(batch.createdAt)} ({batch.cardCount} cards)
									</p>
								</div>
								<div class="flex-shrink-0 text-gray-400 group-hover:text-indigo-600">
									<ArrowRight class="h-5 w-5" />
								</div>
							</div>
						</a>
						<div class="absolute top-1/2 right-4 -translate-y-1/2 transform">
							<button
								on:click|stopPropagation={() => deleteBatch(batch.batchId)}
								disabled={deletingBatchId === batch.batchId}
								title="Delete this entire batch"
								class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if deletingBatchId === batch.batchId}
									Deleting...
								{:else}
									<Trash2 class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
