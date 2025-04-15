<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Trash2, Sparkles, Edit, AlertCircle, PlusCircle, RefreshCw } from 'lucide-svelte';
	import type { Note } from '$lib/types';
	import { formatDate, truncateContent } from '$lib/utils/formatters';
	import { goto } from '$app/navigation';

	type NoteWithBatch = Note & { batchId?: string | null };

	export let data: { notes: NoteWithBatch[]; error?: string };

	let notes: NoteWithBatch[] = [];
	let loading = true;
	let error = data.error || '';

	let actionState: { [key: string]: 'generating' | 'deleting' | 'regenerating' | null } = {};
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
		actionState[id] = 'deleting';
		generationError = '';
		generationSuccess = '';
		error = '';
		try {
			const response = await fetch(`/api/notes/${id}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete note');
			}
			notes = notes.filter((note) => note.id !== id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during deletion';
		} finally {
			actionState[id] = null;
		}
	}

	async function generateFlashcardsForNote(noteId: string | undefined) {
		if (!noteId) return;

		const countInput = prompt('How many flashcards would you like to generate? (1-50)', '5');
		if (countInput === null) return;

		const count = parseInt(countInput, 10);
		if (isNaN(count) || count < 1 || count > 50) {
			generationError = 'Please enter a valid number between 1 and 50.';
			generationSuccess = '';
			return;
		}

		actionState[noteId] = 'generating';
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

			if (data.batchId) {
				await goto(`/flashcards/${data.batchId}`);
			} else {
				generationError = 'Flashcards generated, but could not retrieve batch ID.';
			}
		} catch (err) {
			generationError = err instanceof Error ? err.message : 'An error occurred during generation';
		} finally {
			actionState[noteId] = null;
		}
	}

	async function regenerateFlashcards(noteId: string | undefined, batchId: string | undefined | null) {
		if (!noteId || !batchId) return;

		if (!confirm('This will delete the existing flashcards for this note. Are you sure you want to regenerate?')) {
			return;
		}

		actionState[noteId] = 'regenerating';
		generationSuccess = '';
		generationError = '';

		try {
			const deleteResponse = await fetch(`/api/flashcards/batch/${batchId}`, {
				method: 'DELETE'
			});

			if (!deleteResponse.ok) {
				console.warn(`Failed to delete batch ${batchId} before regenerating, proceeding anyway.`);
			}

			const countInput = prompt('How many flashcards would you like to generate? (1-50)', '5');
			if (countInput === null) {
				actionState[noteId] = null;
				return;
			}
			const count = parseInt(countInput, 10);
			if (isNaN(count) || count < 1 || count > 50) {
				generationError = 'Please enter a valid number between 1 and 50.';
				actionState[noteId] = null;
				return;
			}

			const generateResponse = await fetch('/api/flashcards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ noteId: noteId, count: count })
			});

			const data = await generateResponse.json();

			if (!generateResponse.ok) {
				throw new Error(data.error || 'Failed to generate flashcards');
			}

			if (data.batchId) {
				await goto(`/flashcards/${data.batchId}`);
			} else {
				generationError = 'Flashcards regenerated, but could not retrieve new batch ID.';
			}
		} catch (err) {
			generationError = err instanceof Error ? err.message : 'An error occurred during regeneration';
		} finally {
			actionState[noteId] = null;
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
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
					<li class="block hover:bg-gray-50">
						<div class="flex flex-col p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
							<a href={`/notes/${note.id}`} class="mb-4 block flex-1 sm:mr-6 sm:mb-0">
								<div class="mb-2">
									<h3 class="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
										{note.title || 'Untitled Note'}
									</h3>
									<p class="mt-1 text-sm text-gray-500">
										Created {formatDate(note.createdAt || '')}
									</p>
								</div>
								<div class="prose prose-sm max-w-none">
									<p class="whitespace-pre-line text-gray-700">{truncateContent(note.content)}</p>
								</div>
								</a>
							<div class="flex flex-row space-x-2 sm:flex-col sm:space-y-2 sm:space-x-0">
								<a
									href={`/notes/${note.id}`}
									class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
								>
										<Edit class="mr-1 h-3.5 w-3.5" />
										Edit Note
								</a>

								{#if note.batchId}
									<a
										href={`/flashcards/${note.batchId}`}
										class="inline-flex items-center rounded-md border border-transparent bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
									>
											<svg class="mr-1 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
											View Cards
									</a>
									<button
										on:click|stopPropagation={(e) => { e.stopPropagation(); regenerateFlashcards(note.id, note.batchId); }}
										disabled={actionState[note.id!] === 'regenerating'}
										class="inline-flex items-center rounded-md border border-transparent bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-yellow-50 disabled:text-yellow-400"
									>
										{#if actionState[note.id!] === 'regenerating'}
											<svg class="mr-1 h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
											Regenerating...
										{:else}
											<RefreshCw class="mr-1 h-3.5 w-3.5" />
											Regenerate
										{/if}
									</button>
								{:else}
									<button
										on:click|stopPropagation={(e) => { e.stopPropagation(); generateFlashcardsForNote(note.id); }}
										disabled={actionState[note.id!] === 'generating'}
										class="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-50 disabled:text-indigo-400"
									>
										{#if actionState[note.id!] === 'generating'}
											<svg class="mr-1 h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
											Generating...
										{:else}
											<Sparkles class="mr-1 h-3.5 w-3.5" />
											Generate Cards
										{/if}
									</button>
								{/if}

								<button
									on:click|stopPropagation={(e) => { e.stopPropagation(); deleteNote(note.id); }}
									disabled={actionState[note.id!] === 'deleting'}
									class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if actionState[note.id!] === 'deleting'}
										<svg class="mr-1 h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
										Deleting...
									{:else}
										<Trash2 class="mr-1 h-3.5 w-3.5" />
										Delete Note
									{/if}
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
