<script lang="ts">
	import { Save, Sparkles, AlertCircle, UploadCloud, FileUp } from 'lucide-svelte'; // Add FileUp
	import { goto } from '$app/navigation';
	import { marked } from 'marked';

	let noteTitle = '';
	let noteContent = '';
	let loading = false;
	let error = '';
	let success = '';
	let generating = false;
	let isDraggingOver = false;
	let fileInput: HTMLInputElement; // Reference to the hidden file input

	// --- Refactored File Processing Logic ---
	function processFile(file: File) {
		error = ''; // Clear previous errors

		// Basic check for Markdown type
		if (file.type !== 'text/markdown' && !file.name.toLowerCase().endsWith('.md')) {
			error = 'Invalid file type. Please select a Markdown (.md) file.';
			return;
		}

		const reader = new FileReader();

		reader.onload = (e) => {
			noteContent = e.target?.result as string;
			// Set the note title to the filename (without the .md extension)
			let baseName = file.name;
			if (baseName.toLowerCase().endsWith('.md')) {
				baseName = baseName.substring(0, baseName.length - 3);
			}
			noteTitle = baseName;
			success = `Loaded content from ${file.name}`;
		};

		reader.onerror = () => {
			error = 'Failed to read the file.';
		};

		reader.readAsText(file);
	}
	// --- End Refactored File Processing Logic ---

	async function saveNote() {
		if (!noteContent.trim()) {
			error = 'Note content cannot be empty';
			return null; // Return null on validation failure
		}

		loading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: noteTitle.trim() || 'Untitled Note', // Include title
					content: noteContent
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to save note');
			}

			success = 'Note saved successfully!';
			return data.note; // Return the saved note object
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			return null; // Return null on error
		} finally {
			loading = false;
		}
	}

	async function generateFlashcards() {
		const note = await saveNote(); // Save note first
		if (!note) return;

		const countInput = prompt('How many flashcards would you like to generate? (5-30)', '5');
		if (countInput === null) return;

		const count = parseInt(countInput, 10);
		if (isNaN(count) || count < 1 || count > 50) {
			error = 'Please enter a valid number between 1 and 50.';
			success = '';
			return;
		}

		generating = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/flashcards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					noteId: note.id,
					count: count
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to generate flashcards');
			}

			if (data.batchId) {
				// Redirect to the newly created batch page
				await goto(`/flashcards/${data.batchId}`);
			} else {
				error = 'Flashcards generated, but could not retrieve batch ID.';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during generation';
		} finally {
			generating = false;
		}
	}

	// --- Drag and Drop Handlers ---
	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		isDraggingOver = true;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault(); // Necessary to allow drop
		isDraggingOver = true; // Keep active while hovering
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		// Check if the leave target is outside the drop zone area
		const target = event.relatedTarget as Node;
		const dropZone = event.currentTarget as HTMLElement;
		if (!dropZone.contains(target)) {
			isDraggingOver = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDraggingOver = false;
		const files = event.dataTransfer?.files;
		if (!files || files.length === 0) {
			error = 'No file dropped.';
			return;
		}
		if (files.length > 1) {
			error = 'Please drop only one file.';
			return;
		}
		processFile(files[0]); // Use the refactored function
	}
	// --- End Drag and Drop Handlers ---

	// --- File Input Handler ---
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			processFile(files[0]); // Use the refactored function
		}
		// Reset the input value so the same file can be selected again if needed
		input.value = '';
	}
	// --- End File Input Handler ---
</script>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-8 text-3xl font-bold text-gray-900">Create Notes & Generate Flashcards</h1>

	{#if error}
		<div class="mb-6 flex items-start rounded-md border border-red-200 bg-red-50 p-4">
			<AlertCircle class="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	{#if success}
		<div class="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
			<p class="text-green-800">{success}</p>
		</div>
	{/if}

	<!-- Drop Zone wrapper -->
	<div
		role="region"
		aria-label="Note Drop Zone"
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
				<p class="font-medium">Drop your Markdown file here</p>
			</div>
		{/if}

		<!-- Title Input -->
		<div class="mb-6">
			<label for="noteTitle" class="mb-1 block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="noteTitle"
				bind:value={noteTitle}
				class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				placeholder="Enter a title for your note (optional)"
			/>
		</div>

		<!-- Note Content Textarea -->
		<div class="mb-6">
			<label for="noteContent" class="mb-1 block text-sm font-medium text-gray-700"
				>Your Notes</label
			>
			<div class="relative">
				<div class="absolute top-2 right-2 rounded-md bg-gray-100 p-1 text-xs text-gray-500">
					{noteContent.length} characters
				</div>
				<textarea
					id="noteContent"
					bind:value={noteContent}
					rows="12"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					placeholder="Enter your notes here or drop a Markdown file..."
				></textarea>
			</div>
			<!-- File Input Trigger -->
			<div class="mt-2 flex items-center justify-between">
				<p class="text-sm text-gray-500">
					Write or paste notes, or drag & drop a Markdown file onto this area.
				</p>
				<!-- Hidden File Input -->
				<input
					type="file"
					bind:this={fileInput}
					on:change={handleFileSelect}
					accept=".md,text/markdown"
					class="hidden"
					aria-hidden="true"
				/>
				<!-- Visible Browse Button -->
				<button
					type="button"
					on:click={() => fileInput?.click()}
					class="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					<FileUp class="mr-1.5 h-3.5 w-3.5" />
					Browse File...
				</button>
			</div>
		</div>

		<!-- Live Preview Section -->
		{#if noteContent.trim()}
			<div class="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
				<h3 class="mb-2 text-sm font-medium text-gray-700">Live Preview</h3>
				<div class="prose prose-sm max-w-none">
					{@html marked(noteContent)}
				</div>
			</div>
		{/if}

		<!-- Buttons -->
		<div class="flex justify-end gap-4">
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				on:click={() => goto('/notes')}
			>
				Cancel
			</button>
			<button
				on:click={saveNote}
				disabled={loading || !noteContent.trim()}
				class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
			>
				{#if loading}
					<svg
						class="mr-2 -ml-1 h-4 w-4 animate-spin text-gray-700"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Saving...
				{:else}
					<Save class="mr-2 h-4 w-4" />
					Save Notes
				{/if}
			</button>

			<button
				on:click={generateFlashcards}
				disabled={generating || !noteContent.trim()}
				class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-300"
			>
				{#if generating}
					<svg
						class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Generating...
				{:else}
					<Sparkles class="mr-2 h-4 w-4" />
					Save & Generate Flashcards
				{/if}
			</button>
		</div>
	</div>
</div>
