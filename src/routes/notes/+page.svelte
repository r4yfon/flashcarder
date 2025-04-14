<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Trash2, Sparkles, ExternalLink, AlertCircle, PlusCircle } from 'lucide-svelte';
	import type { Note } from '$lib/types';
	import { formatDate, truncateContent } from '$lib/utils/formatters';

	export let data: { notes: Note[] };

	let notes: Note[] = [];
	let loading = true;
	let error = '';

	let generatingId: string | null = null;
	let generationSuccess = '';
	let generationError = '';

	onMount(() => {
		notes = data.notes || [];
		loading = false;
	});

	async function deleteNote(id: string | undefined) {
		if (!id || !confirm('Are you sure you want to delete this note?')) {
			return;
		}

		try {
			const response = await fetch('/api/notes', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			if (!response.ok) {
				throw new Error('Failed to delete note');
			}

			notes = notes.filter((note) => note.id !== id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during deletion';
		}
	}

	async function generateFlashcardsForNote(noteId: string | undefined) {
		if (!noteId) return;

		const countInput = prompt('How many flashcards would you like to generate? (5-30)', '5');
		if (countInput === null) return;

		const count = parseInt(countInput, 10);
		if (isNaN(count) || count < 1 || count > 50) {
			generationError = 'Please enter a valid number between 1 and 50.';
			generationSuccess = '';
			return;
		}

		generatingId = noteId;
		generationSuccess = '';
		generationError = '';

		try {
			const response = await fetch('/api/flashcards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ noteId: noteId, count: count })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to generate flashcards');
			}

			generationSuccess = `Successfully generated ${data.flashcards?.length || 0} flashcards for this note! View them on the Flashcards page.`;
		} catch (err) {
			generationError = err instanceof Error ? err.message : 'An error occurred during generation';
		} finally {
			generatingId = null;
		}
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">My Notes</h1>
		<a
			href="/notes/new"
			class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
		>
			<PlusCircle class="mr-2 h-4 w-4" />
			New Note
		</a>
	</div>

	{#if generationError}
		<div class="my-4 flex items-start rounded-md border border-red-200 bg-red-50 p-4">
			<AlertCircle class="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
			<p class="text-red-800">{generationError}</p>
		</div>
	{/if}
	{#if generationSuccess}
		<div class="my-4 flex items-start rounded-md border border-green-200 bg-green-50 p-4">
			<p class="text-green-800">{generationSuccess}</p>
			<a href="/flashcards" class="ml-auto text-sm font-medium text-green-700 hover:text-green-900"
				>View Flashcards &rarr;</a
			>
		</div>
	{/if}
	{#if error && !generationError}
		<div class="mb-6 flex items-start rounded-md border border-red-200 bg-red-50 p-4">
			<AlertCircle class="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<svg
				class="h-8 w-8 animate-spin text-indigo-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if notes.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
			<FileText class="mx-auto mb-4 h-12 w-12 text-gray-400" />
			<h3 class="mb-2 text-lg font-medium text-gray-900">No notes found</h3>
			<p class="mb-4 text-gray-500">You haven't created any notes yet.</p>
			<a
				href="/notes/new"
				class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
			>
				<PlusCircle class="mr-2 h-4 w-4" />
				Create Your First Note
			</a>
		</div>
	{:else if notes.length > 0}
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			<ul role="list" class="divide-y divide-gray-200">
				{#each notes as note (note.id)}
					<li class="p-4 hover:bg-gray-50 sm:p-6">
						<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
							<div class="mb-4 flex-1 sm:mr-6 sm:mb-0">
								<div class="mb-2">
									<h3 class="text-lg font-medium text-gray-900">{note.title || 'Untitled Note'}</h3>
									<p class="mt-1 text-sm text-gray-500">
										Created {formatDate(note.createdAt || '')}
									</p>
								</div>
								<div class="prose prose-sm max-w-none">
									<p class="whitespace-pre-line text-gray-700">{truncateContent(note.content)}</p>
								</div>
							</div>
							<div class="flex flex-row space-x-2 sm:flex-col sm:space-y-2 sm:space-x-0">
								<a
									href={`/notes/${note.id}`}
									class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
								>
									<ExternalLink class="mr-1 h-3.5 w-3.5" />
									View
								</a>
								<button
									on:click={() => generateFlashcardsForNote(note.id)}
									disabled={generatingId === note.id}
									class="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-50 disabled:text-indigo-400"
								>
									{#if generatingId === note.id}
										<svg
											class="mr-1 h-3.5 w-3.5 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Generating...
									{:else}
										<Sparkles class="mr-1 h-3.5 w-3.5" />
										Generate
									{/if}
								</button>
								<button
									on:click={() => deleteNote(note.id)}
									class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									<Trash2 class="mr-1 h-3.5 w-3.5" />
									Delete
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
		<h3 class="mb-3 text-lg font-medium text-gray-900">Note Management Tips</h3>
		<ul class="list-inside list-disc space-y-2 text-gray-600">
			<li>
				<strong>Regular review</strong> - Schedule time to review and update your notes periodically
			</li>
			<li>
				<strong>Generate flashcards</strong> - Create flashcards from your most important notes for better
				retention
			</li>
			<li>
				<strong>Associate with documents</strong> - Connect notes to related documents for better organization
			</li>
			<li>
				<strong>Be consistent</strong> - Use a consistent format for all your notes to make them easier
				to review
			</li>
		</ul>
	</div>
</div>
