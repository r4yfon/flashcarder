<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ChevronLeft,
		Edit,
		Trash2,
		AlertCircle,
		BookOpen,
		Save,
		X,
		UploadCloud
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { marked } from 'marked'; // Import marked

	export let data: PageData;

	let loading = true;
	let error = '';
	let note = data.note;

	let isEditing = false;
	let editedTitle = '';
	let editedContent = '';
	let isSaving = false;
	let editError = '';

	let generating = false;
	let generationSuccess = '';
	let generationError = '';

	let isDraggingOver = false;

	onMount(() => {
		loading = false;
		if (note) {
			editedTitle = note.title || '';
			editedContent = note.content || '';
		}
	});

	function startEditing() {
		if (!note) return;
		editedTitle = note.title || '';
		editedContent = note.content || '';
		isEditing = true;
		editError = '';
		error = '';
	}

	function cancelEditing() {
		isEditing = false;
		editError = '';
	}

	async function saveChanges() {
		if (!note?.id || !isEditing) return;

		const originalTitle = note.title;
		const originalContent = note.content;
		const newTitle = editedTitle.trim();
		const newContent = editedContent.trim();

		if (newTitle === originalTitle && newContent === originalContent) {
			cancelEditing();
			return;
		}
		if (!newContent) {
			editError = 'Note content cannot be empty.';
			return;
		}

		isSaving = true;
		editError = '';
		error = '';

		try {
			const response = await fetch(`/api/notes/${note.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle || 'Untitled Note',
					content: newContent
				})
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || 'Failed to update note');
			}

			note = {
				...note,
				title: newTitle || 'Untitled Note',
				content: newContent,
				updatedAt: responseData.updatedAt
			};
			cancelEditing();
		} catch (err) {
			editError = err instanceof Error ? err.message : 'An error occurred while saving changes';
		} finally {
			isSaving = false;
		}
	}

	async function generateFlashcardsForNote() {
		if (!note?.id) return;

		const countInput = prompt('How many flashcards would you like to generate? (1-50)', '5');
		if (countInput === null) return;
		const count = parseInt(countInput, 10);
		if (isNaN(count) || count < 1 || count > 50) {
			generationError = 'Please enter a valid number between 1 and 50.';
			generationSuccess = '';
			return;
		}

		generating = true;
		generationSuccess = '';
		generationError = '';

		try {
			const response = await fetch('/api/flashcards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ noteId: note.id, count: count })
			});
			const responseData = await response.json();
			if (!response.ok) {
				throw new Error(responseData.error || 'Failed to generate flashcards');
			}
			if (responseData.batchId) {
				await goto(`/flashcards/${responseData.batchId}`);
			} else {
				generationError = 'Flashcards generated, but could not retrieve batch ID.';
			}
		} catch (err) {
			generationError = err instanceof Error ? err.message : 'An error occurred during generation';
		} finally {
			generating = false;
		}
	}

	async function deleteNote() {
		if (!note?.id || !confirm('Are you sure you want to delete this note?')) {
			return;
		}
		error = '';
		try {
			const response = await fetch(`/api/notes/${note.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete note');
			}
			await goto('/notes');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete note';
		}
	}

	function formatDate(dateStr: string | Date | undefined) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		isDraggingOver = true;
	}
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDraggingOver = true;
	}
	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		const target = event.relatedTarget as Node;
		const dropZone = event.currentTarget as HTMLElement;
		if (!dropZone || !dropZone.contains(target)) {
			isDraggingOver = false;
		}
	}
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDraggingOver = false;
		editError = '';

		const files = event.dataTransfer?.files;
		if (!files || files.length === 0) {
			editError = 'No file dropped.';
			return;
		}
		if (files.length > 1) {
			editError = 'Please drop only one file.';
			return;
		}
		const file = files[0];
		if (file.type !== 'text/markdown' && !file.name.toLowerCase().endsWith('.md')) {
			editError = 'Invalid file type. Please drop a Markdown (.md) file.';
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			editedContent = e.target?.result as string;
			let baseName = file.name;
			if (baseName.toLowerCase().endsWith('.md')) {
				baseName = baseName.substring(0, baseName.length - 3);
			}
		};
		reader.onerror = () => {
			editError = 'Failed to read the file.';
		};
		reader.readAsText(file);
	}
</script>

<div class="mx-auto max-w-4xl py-6">
	<div class="mb-6">
		<a href="/notes" class="inline-flex items-center text-indigo-600 hover:text-indigo-800">
			<ChevronLeft class="mr-1 h-4 w-4" />
			Back to Notes
		</a>
	</div>

	{#if error}
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
	{:else if !note}
		<div class="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
			<AlertCircle class="mx-auto mb-4 h-12 w-12 text-red-400" />
			<h3 class="mb-2 text-lg font-medium text-gray-900">Note Not Found</h3>
			<p class="mb-4 text-gray-500">The note you're looking for doesn't exist or was deleted.</p>
			<a
				href="/notes"
				class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
			>
				<ChevronLeft class="mr-2 h-4 w-4" />
				Return to Notes
			</a>
		</div>
	{:else if isEditing}
		<div
			role="region"
			aria-label="Note Edit Drop Zone"
			class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors {isDraggingOver
				? 'border-indigo-500 bg-indigo-50'
				: ''}"
			on:dragenter={handleDragEnter}
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
		>
			{#if isDraggingOver}
				<div
					class="pointer-events-none mb-4 flex flex-col items-center justify-center text-indigo-600"
				>
					<UploadCloud class="mb-2 h-12 w-12" />
					<p class="font-medium">Drop Markdown file to replace content</p>
				</div>
			{/if}

			{#if editError}
				<div class="mb-4 flex items-start rounded-md border border-red-200 bg-red-50 p-4">
					<AlertCircle class="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
					<p class="text-red-800">{editError}</p>
				</div>
			{/if}

			<div class="mb-4">
				<label for="editNoteTitle" class="mb-1 block text-sm font-medium text-gray-700">Title</label
				>
				<input
					type="text"
					id="editNoteTitle"
					bind:value={editedTitle}
					disabled={isSaving}
					class="block w-full rounded-md border-gray-300 text-xl font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-2xl"
					placeholder="Enter a title for your note"
				/>
			</div>

			<div class="mb-6">
				<label for="editNoteContent" class="mb-1 block text-sm font-medium text-gray-700"
					>Content</label
				>
				<div class="relative">
					<div class="absolute top-2 right-2 rounded-md bg-gray-100 p-1 text-xs text-gray-500">
						{editedContent.length} characters
					</div>
					<textarea
						id="editNoteContent"
						bind:value={editedContent}
						disabled={isSaving}
						rows="15"
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Enter your notes here or drop a Markdown file..."
					></textarea>
				</div>
				<p class="mt-1 text-sm text-gray-500">
					Modify your notes or drag & drop a Markdown (.md) file onto this area to replace content.
				</p>
			</div>

			<div class="flex items-center justify-end gap-3">
				<button
					on:click={cancelEditing}
					disabled={isSaving}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					<X class="mr-1 -ml-1 inline h-4 w-4" /> Cancel
				</button>
				<button
					on:click={saveChanges}
					disabled={isSaving || !editedContent.trim()}
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-300"
				>
					{#if isSaving}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
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
						Saving...
					{:else}
						<Save class="mr-1 -ml-1 h-4 w-4" /> Save Changes
					{/if}
				</button>
			</div>
			<div class="prose prose-indigo mt-6 max-w-none">
				{@html marked(note.content || '')}
			</div>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
			<div class="p-6">
				<div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{note.title || 'Untitled Note'}</h1>
						<p class="mt-1 text-sm text-gray-500">
							Created {formatDate(note.createdAt)}
							{#if note.updatedAt && note.updatedAt !== note.createdAt}
								<span class="ml-2 italic">(Updated {formatDate(note.updatedAt)})</span>
							{/if}
						</p>
					</div>
					<div class="mt-4 flex space-x-2 sm:mt-0">
						<button
							on:click={startEditing}
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							<Edit class="mr-1 h-4 w-4" />
							Edit
						</button>
						<button
							on:click={deleteNote}
							class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
						>
							<Trash2 class="mr-1 h-4 w-4" />
							Delete
						</button>
					</div>
				</div>

				<!-- Apply prose classes to the container and render HTML -->
				<div class="prose prose-indigo mt-6 max-w-none">
					{@html marked(note.content || '')}
				</div>
			</div>
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
				<a
					href="/flashcards"
					class="ml-auto text-sm font-medium text-green-700 hover:text-green-900"
					>View Flashcards &rarr;</a
				>
			</div>
		{/if}

		<div class="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
			<div class="w-full rounded-lg border border-indigo-100 bg-indigo-50 p-5 sm:w-1/2">
				<h3 class="mb-3 text-lg font-medium text-indigo-900">Create Flashcards</h3>
				<p class="mb-4 text-indigo-700">
					Turn key points from this note into flashcards to improve retention and recall.
				</p>
				<button
					on:click={generateFlashcardsForNote}
					disabled={generating}
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-300"
				>
					{#if generating}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
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
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Generating...
					{:else}
						<BookOpen class="mr-1 h-4 w-4" />
						Generate Flashcards
					{/if}
				</button>
			</div>

			<div class="w-full rounded-lg border border-gray-200 bg-gray-50 p-5 sm:w-1/2">
				<h3 class="mb-3 text-lg font-medium text-gray-900">Note Tips</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li>• Review this note regularly to reinforce learning</li>
					<li>• Create flashcards for active recall practice</li>
					<li>• Summarize key points for better retention</li>
					<li>• Link related concepts from different notes</li>
				</ul>
			</div>
		</div>
	{/if}
</div>
