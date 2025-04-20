<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import {
		FileText,
		Trash2,
		Sparkles,
		Edit,
		AlertCircle,
		PlusCircle,
		RefreshCw,
		X,
		AlertTriangle // Import AlertTriangle for confirmation state
	} from 'lucide-svelte';
	import type { Note } from '$lib/types';
	import { formatDate } from '$lib/utils/formatters';
	import { goto } from '$app/navigation';

	type NoteWithBatch = Note & { batchId?: string | null };

	const { data } = $props<{ notes: NoteWithBatch[]; error?: string }>();

	let notes: NoteWithBatch[] = $state([]);
	let loading = $state(true);
	let error = $state(data.error || '');

	let actionState: { [key: string]: 'generating' | 'deleting' | 'regenerating' | null } = $state(
		{}
	);
	let generationSuccess = $state('');
	let generationError = $state('');
	let pendingDeleteId: string | null = $state(null); // State for two-step delete

	// --- Error Banner Logic ---
	let errorVisible = $state(false);
	const errorDuration = 8000;
	let remainingTime = $state(errorDuration);
	let startTime: number | null = null;
	let errorTimerId: ReturnType<typeof requestAnimationFrame> | null = null;
	let progressPercent = $derived((remainingTime / errorDuration) * 100);

	function dismissError() {
		if (errorTimerId) {
			cancelAnimationFrame(errorTimerId);
			errorTimerId = null;
		}
		errorVisible = false;
		startTime = null;
		remainingTime = errorDuration; // Reset for next time
	}

	function timerLoop(timestamp: number) {
		if (!startTime) {
			startTime = timestamp;
		}
		const elapsed = timestamp - startTime;
		remainingTime = Math.max(0, errorDuration - elapsed);

		if (remainingTime <= 0) {
			dismissError();
		} else {
			errorTimerId = requestAnimationFrame(timerLoop);
		}
	}

	function startErrorTimer() {
		dismissError();

		if (error) {
			errorVisible = true;
			remainingTime = errorDuration;
			startTime = null;
			errorTimerId = requestAnimationFrame(timerLoop);
		} else {
			errorVisible = false;
		}
	}

	$effect(() => {
		if (error && typeof window !== 'undefined') {
			startErrorTimer();
		} else if (!error && errorVisible) {
			dismissError();
		}
	});
	// --- End Error Banner Logic ---

	// Function to handle the delete button click (first or second step)
	function handleDeleteClick(id: string | undefined) {
		if (!id) return;

		if (pendingDeleteId === id) {
			// Second click: Perform deletion
			executeDelete(id);
		} else {
			// First click: Set pending state
			pendingDeleteId = id;
		}
	}

	// Function to execute the actual deletion API call
	async function executeDelete(id: string) {
		actionState = { ...actionState, [id]: 'deleting' };
		generationError = '';
		generationSuccess = '';
		error = '';

		try {
			const response = await fetch(`/api/notes/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				let errorMessage = 'Failed to delete note due to an unknown error.';
				try {
					const errorData = await response.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (parseError) {
					errorMessage = `Failed to delete note: ${response.statusText} (Status: ${response.status})`;
					console.error('Failed to parse error response:', parseError);
				}
				throw new Error(errorMessage);
			}

			notes = notes.filter((note) => note.id !== id);
			generationSuccess = 'Note deleted successfully.';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred during deletion';
		} finally {
			actionState = { ...actionState, [id]: null };
			pendingDeleteId = null; // Reset pending state after attempt
		}
	}

	// Reset pending delete if user clicks outside
	function handleWindowClick(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('[data-delete-confirm-button]')) {
			pendingDeleteId = null;
		}
	}

	onMount(() => {
		notes = data.notes || [];
		loading = false;
		if (error) {
			startErrorTimer();
		}
		window.addEventListener('click', handleWindowClick);
	});

	onDestroy(() => {
		if (errorTimerId) {
			cancelAnimationFrame(errorTimerId);
		}
		window.removeEventListener('click', handleWindowClick);
	});

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

	async function regenerateFlashcards(
		noteId: string | undefined,
		batchId: string | undefined | null
	) {
		if (!noteId || !batchId) return;

		if (
			!confirm(
				'This will delete the existing flashcards for this note. Are you sure you want to regenerate?'
			)
		) {
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
			generationError =
				err instanceof Error ? err.message : 'An error occurred during regeneration';
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

	<!-- Updated Error Banner with Progress Line, Dismiss Button, and Fade Transition -->
	{#if errorVisible && !generationError}
		<div
			class="relative mb-6 overflow-hidden rounded-md border border-red-200 bg-red-50"
			role="alert"
			transition:fade={{ duration: 300 }}
		>
			<div class="flex items-center space-x-3 p-4">
				<AlertCircle class="h-5 w-5 flex-shrink-0 text-red-500" />
				<p class="flex-1 text-sm text-red-800">{error}</p>
				<button
					type="button"
					onclick={dismissError}
					class="-m-1.5 flex-shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 focus:outline-none"
					aria-label="Dismiss"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
			<!-- Progress Bar -->
			<div class="absolute bottom-0 left-0 h-1 bg-red-400" style="width: {progressPercent}%;"></div>
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
					<li class="group block hover:bg-gray-50">
						<div class="flex flex-col p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
							<!-- Make the main content area clickable -->
							<a href={`/notes/${note.id}`} class="mb-4 block flex-1 sm:mr-6 sm:mb-0">
								<div class="mb-2">
									<h3 class="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
										{note.title || 'Untitled Note'}
									</h3>
									<p class="mt-1 text-sm text-gray-500">
										Created {formatDate(note.createdAt || '')}
									</p>
									{#if note.updatedAt && note.updatedAt !== note.createdAt}
										<p class="mt-1 text-xs text-gray-400">
											Updated {formatDate(note.updatedAt)}
										</p>
									{/if}
								</div>
								<!-- Optional: Add a preview of note content here if desired -->
							</a>

							<!-- Updated Button Layout -->
							<div class="flex w-full flex-row gap-3 sm:w-auto sm:max-w-xs">
								{#if note.batchId}
									<!-- View Cards Button -->
									<a
										href={`/flashcards/${note.batchId}`}
										onclick={(e) => e.stopPropagation()}
										class="flex w-24 flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-md transition duration-150 ease-in-out hover:border-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none active:translate-y-px active:shadow-sm"
									>
										<svg
											class="mb-1 h-6 w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											></path>
										</svg>
										View
									</a>
									<!-- Regenerate Button -->
									<button
										onclick={(e) => {
											e.stopPropagation();
											regenerateFlashcards(note.id, note.batchId);
										}}
										disabled={actionState[note.id!] === 'regenerating'}
										class="flex w-24 flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-md transition duration-150 ease-in-out hover:border-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none"
									>
										{#if actionState[note.id!] === 'regenerating'}
											<svg class="mb-1 h-6 w-6 animate-spin" viewBox="0 0 24 24">...</svg>
											Regenerate
										{:else}
											<RefreshCw class="mb-1 h-6 w-6" />
											Regenerate
										{/if}
									</button>
								{:else}
									<!-- Generate Cards Button -->
									<button
										onclick={(e) => {
											e.stopPropagation();
											generateFlashcardsForNote(note.id);
										}}
										disabled={actionState[note.id!] === 'generating'}
										class="flex w-24 flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-md transition duration-150 ease-in-out hover:border-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none"
									>
										{#if actionState[note.id!] === 'generating'}
											<svg class="mb-1 h-6 w-6 animate-spin" viewBox="0 0 24 24">...</svg>
											Generate
										{:else}
											<Sparkles class="mb-1 h-6 w-6" />
											Generate
										{/if}
									</button>
								{/if}

								<!-- Delete / Confirm Delete Button -->
								<button
									data-delete-confirm-button="true"
									onclick={(e) => {
										e.stopPropagation();
										handleDeleteClick(note.id);
									}}
									disabled={actionState[note.id!] === 'deleting'}
									class={`flex w-24 flex-col items-center justify-center rounded-md p-2 text-xs font-medium shadow-md transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none active:translate-y-px active:shadow-sm
											${
												pendingDeleteId === note.id
													? 'border border-red-500 bg-white text-red-800 hover:border-red-600 hover:bg-red-50 focus:ring-red-600 disabled:border-gray-200 disabled:text-red-400'
													: 'border border-gray-300 bg-white text-red-700 hover:border-gray-400 hover:bg-red-50 focus:ring-red-500 disabled:border-gray-200 disabled:text-red-400'
											}`}
								>
									{#if actionState[note.id!] === 'deleting'}
										<svg class="mb-1 h-6 w-6 animate-spin" viewBox="0 0 24 24">...</svg>
										Delete
									{:else if pendingDeleteId === note.id}
										<AlertTriangle class="mb-1 h-6 w-6" />
										Confirm?
									{:else}
										<Trash2 class="mb-1 h-6 w-6" />
										Delete
									{/if}
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
