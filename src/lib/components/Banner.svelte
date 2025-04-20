<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-svelte';

	type BannerType = 'error' | 'success' | 'warning';

	let {
		message = '',
		type = 'error' as BannerType,
		duration = 5000, // Default duration 5 seconds
		visible = false,
		onDismiss = () => {}
	} = $props<{
		message?: string;
		type?: BannerType;
		duration?: number;
		visible?: boolean;
		onDismiss?: () => void;
	}>();

	let internalVisible = $state(visible);
	let remainingTime = $state(duration);
	let startTime: number | null = null;
	let timerId: ReturnType<typeof requestAnimationFrame> | null = null;

	let progressPercent = $derived((remainingTime / duration) * 100);

	const typeStyles = $derived(() => {
		switch (type) {
			case 'success':
				return {
					bgColor: 'bg-green-50',
					borderColor: 'border-green-200',
					textColor: 'text-green-800',
					iconColor: 'text-green-500',
					progressColor: 'bg-green-400',
					hoverBgColor: 'hover:bg-green-100',
					focusRingColor: 'focus:ring-green-600',
					focusOffsetColor: 'focus:ring-offset-green-50',
					IconComponent: CheckCircle
				};
			case 'warning':
				return {
					bgColor: 'bg-yellow-50',
					borderColor: 'border-yellow-200',
					textColor: 'text-yellow-800',
					iconColor: 'text-yellow-500',
					progressColor: 'bg-yellow-400',
					hoverBgColor: 'hover:bg-yellow-100',
					focusRingColor: 'focus:ring-yellow-600',
					focusOffsetColor: 'focus:ring-offset-yellow-50',
					IconComponent: AlertTriangle
				};
			case 'error':
			default:
				return {
					bgColor: 'bg-red-50',
					borderColor: 'border-red-200',
					textColor: 'text-red-800',
					iconColor: 'text-red-500',
					progressColor: 'bg-red-400',
					hoverBgColor: 'hover:bg-red-100',
					focusRingColor: 'focus:ring-red-600',
					focusOffsetColor: 'focus:ring-offset-red-50',
					IconComponent: AlertCircle
				};
		}
	});

	function dismiss() {
		if (timerId) {
			cancelAnimationFrame(timerId);
			timerId = null;
		}
		internalVisible = false;
		startTime = null;
		remainingTime = duration; // Reset for next time
		onDismiss(); // Call the parent's dismiss handler
	}

	function timerLoop(timestamp: number) {
		if (!startTime) {
			startTime = timestamp;
		}
		const elapsed = timestamp - startTime;
		remainingTime = Math.max(0, duration - elapsed);

		if (remainingTime <= 0) {
			dismiss();
		} else {
			timerId = requestAnimationFrame(timerLoop);
		}
	}

	function startTimer() {
		// Clear any existing timer/state first
		if (timerId) {
			cancelAnimationFrame(timerId);
		}
		remainingTime = duration; // Reset time
		startTime = null; // Reset start time
		timerId = requestAnimationFrame(timerLoop); // Start the animation loop
	}

	// React to external visibility changes or message changes
	$effect(() => {
		if (visible && message) {
			internalVisible = true;
			startTimer();
		} else {
			// If visibility is controlled externally and set to false, dismiss
			if (!visible && internalVisible) {
				dismiss();
			}
		}
	});

	// Ensure timer is cleaned up
	onDestroy(() => {
		if (timerId) {
			cancelAnimationFrame(timerId);
		}
	});
</script>

{#if internalVisible && message}
	<div
		class="relative mb-6 overflow-hidden rounded-md border {typeStyles.bgColor} {typeStyles.borderColor}"
		role="alert"
		transition:fade={{ duration: 300 }}
	>
		<div class="flex items-center space-x-3 p-4">
			{#key typeStyles().IconComponent}
				{#if typeStyles().IconComponent}
					{#if typeStyles().IconComponent}
						<typeStyles().IconComponent class="h-5 w-5 flex-shrink-0 {typeStyles().iconColor}" />
					{/if}
				{/if}
			{/key}
			<p class="flex-1 text-sm {typeStyles().textColor}">{message}</p>
			<button
				type="button"
				onclick={dismiss}
				class="-m-1.5 flex-shrink-0 rounded-md p-1.5 {typeStyles.iconColor} {typeStyles.hoverBgColor} focus:ring-2 focus:outline-none {typeStyles.focusRingColor} focus:ring-offset-2 {typeStyles.focusOffsetColor}"
				aria-label="Dismiss"
			>
				<X class="h-5 w-5" />
			</button>
		</div>
		<!-- Progress Bar -->
		<div
			class="absolute bottom-0 left-0 h-1 {typeStyles.progressColor}"
			style="width: {progressPercent}%;"
		></div>
	</div>
{/if}
