<script lang="ts">
	import '../app.css';
	import { BookOpen, Home, Menu, X, FileText } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	// Function to check if a route is active for styling of navbar
	const isActive = $derived((path: string) => {
		// Handle exact match for home page
		if (path === '/' && page.url.pathname === '/') {
			return true;
		}
		// Handle other pages (including sub-routes)
		if (path !== '/' && page.url.pathname.startsWith(path)) {
			return true;
		}
		return false;
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	// Close mobile menu when window resizes to desktop size
	onMount(() => {
		const handleResize = () => {
			if (window.innerWidth >= 640 && mobileMenuOpen) {
				mobileMenuOpen = false;
			}
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation bar -->
	<nav class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<a class="flex flex-shrink-0 items-center" href="/">
					<BookOpen class="h-8 w-8 text-indigo-600" />
					<span class="ml-2 text-xl font-bold text-gray-900">FlashCarder</span>
				</a>
				<div class="hidden sm:flex sm:space-x-8">
					<a
						href="/"
						class="inline-flex items-center border-b-2 {isActive('/')
							? 'border-indigo-500 text-gray-900'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} px-1 pt-1 text-sm font-medium"
					>
						<Home class="mr-1 h-4 w-4" />
						Home
					</a>
					<a
						href="/notes"
						class="inline-flex items-center border-b-2 {isActive('/notes')
							? 'border-indigo-500 text-gray-900'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} px-1 pt-1 text-sm font-medium"
					>
						<FileText class="mr-1 h-4 w-4" />
						Notes
					</a>
					<a
						href="/flashcards"
						class="inline-flex items-center border-b-2 {isActive('/flashcards')
							? 'border-indigo-500 text-gray-900'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} px-1 pt-1 text-sm font-medium"
					>
						<BookOpen class="mr-1 h-4 w-4" />
						Flashcards
					</a>
				</div>

				<!-- Mobile menu button -->
				<button
					type="button"
					class="inline-flex h-fit items-center justify-center self-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-inset sm:hidden"
					onclick={toggleMobileMenu}
					aria-expanded={mobileMenuOpen}
				>
					<span class="sr-only">Open main menu</span>
					{#if mobileMenuOpen}
						<X class="block h-6 w-6" aria-hidden="true" />
					{:else}
						<Menu class="block h-6 w-6" aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile menu, show/hide based on menu state -->
		{#if mobileMenuOpen}
			<div class="sm:hidden">
				<div class="space-y-1 pt-2 pb-3">
					<a
						href="/"
						class="block border-l-4 {isActive('/')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'} py-2 pr-4 pl-3 text-base font-medium"
					>
						<Home class="mr-2 inline h-4 w-4" />
						Home
					</a>
					<a
						href="/notes"
						class="block border-l-4 {isActive('/notes')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'} py-2 pr-4 pl-3 text-base font-medium"
					>
						<FileText class="mr-2 inline h-4 w-4" />
						Notes
					</a>
					<a
						href="/flashcards"
						class="block border-l-4 {isActive('/flashcards')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'} py-2 pr-4 pl-3 text-base font-medium"
					>
						<BookOpen class="mr-2 inline h-4 w-4" />
						Flashcards
					</a>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Page content -->
	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-gray-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<p class="text-center text-sm text-gray-500">© 2025 FlashCarder. All rights reserved.</p>
		</div>
	</footer>
</div>
