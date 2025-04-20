/**
 * Formats a date string or Date object into a more readable format.
 * Example: 'Apr 14, 2025, 10:30 PM'
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
	if (!dateInput) {
		return 'N/A';
	}
	try {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	} catch (e) {
		return 'Invalid Date';
	}
}

/**
 * Truncates a string to a specified length and adds an ellipsis.
 */
export function truncateContent(
	content: string | undefined | null,
	maxLength: number = 150
): string {
	if (!content) {
		return '';
	}
	if (content.length <= maxLength) {
		return content;
	}
	// Find the last space within the maxLength to avoid cutting words
	const truncated = content.substring(0, maxLength);
	const lastSpaceIndex = truncated.lastIndexOf(' ');
	if (lastSpaceIndex > 0) {
		return truncated.substring(0, lastSpaceIndex) + '...';
	}
	// If no space found, just cut at maxLength
	return truncated + '...';
}
