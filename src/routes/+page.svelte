<script lang="ts">
	import { FileText, Sparkles } from 'lucide-svelte';
</script>

<div class="text-center">
	<h1 class="mt-4 mb-8 text-4xl font-extrabold tracking-tight text-balance text-gray-900">
		Create Flashcards from Your Notes
	</h1>
	<p class="mx-auto mb-12 max-w-3xl text-xl text-balance text-gray-500">
		Write down your study notes. Our AI will generate flashcards to help you study more effectively.
	</p>

	<div class="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Add Notes -->
		<div
			class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100"
				>
					<FileText class="h-6 w-6 text-indigo-600" />
				</div>
				<h2 class="mb-2 text-lg font-medium text-gray-900">Add Your Notes</h2>
				<p class="mb-4 text-gray-500">
					Write or paste your own study notes to generate personalised flashcards.
				</p>
			</div>
			<a
				href="/notes/new"
				class="flex items-center justify-center font-medium text-indigo-600 hover:text-indigo-800"
			>
				Create Notes <span class="ml-1">→</span>
			</a>
		</div>

		<!-- Generate Flashcards -->
		<div
			class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100"
				>
					<Sparkles class="h-6 w-6 text-indigo-600" />
				</div>
				<h2 class="mb-2 text-lg font-medium text-gray-900">Generate Flashcards</h2>
				<p class="mb-4 text-gray-500">
					Our AI analyses your notes and creates effective study flashcards.
				</p>
			</div>
			<a
				href="/flashcards"
				class="flex items-center justify-center font-medium text-indigo-600 hover:text-indigo-800"
			>
				View Flashcards <span class="ml-1">→</span>
			</a>
		</div>
	</div>

	<div class="mx-auto mt-12 max-w-5xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
		<h2 class="mb-4 text-2xl font-bold text-gray-900">How It Works</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100"
				>
					<span class="font-bold text-indigo-600">1</span>
				</div>
				<h3 class="mb-2 font-medium text-gray-900">Write Your Notes</h3>
				<p class="text-sm text-gray-500">Add your own study notes directly in the app.</p>
			</div>
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100"
				>
					<span class="font-bold text-indigo-600">2</span>
				</div>
				<h3 class="mb-2 font-medium text-gray-900">Generate Flashcards</h3>
				<p class="text-sm text-gray-500">Our AI analyses your notes and creates flashcards.</p>
			</div>
		</div>
	</div>
</div>
