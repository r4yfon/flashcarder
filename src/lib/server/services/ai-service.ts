import type { Flashcard } from '$lib/types';
import { env } from '$env/dynamic/private';

/**
 * Generate flashcards from content using the OpenRouter API
 * This uses the OpenRouter free tier to access open-source models
 */
export async function generateFlashcards(content: string, count: number = 5): Promise<Flashcard[]> {
	try {
		// Limit content length to avoid exceeding model context limits
		const maxContentLength = 7500; // Slightly reduced to leave room for prompt
		const truncatedContent = content.substring(0, maxContentLength);

		const prompt = `
You are an AI assistant specialized in creating educational flashcards.
Analyze the following content and generate exactly ${count} flashcards.
Each flashcard must be an object with two keys: "question" and "answer".
Focus on the most important concepts, definitions, facts, and relationships in the text.
Questions should be clear and specific. Answers should be concise yet complete.

Content to analyze:
---
${truncatedContent}
---

Your response MUST be ONLY a valid JSON object containing a single key "flashcards" whose value is an array of the generated flashcard objects.
Do NOT include any text, explanations, or markdown formatting before or after the JSON object.

Example of the required JSON output format:
{
  "flashcards": [
    { "question": "What is the capital of France?", "answer": "Paris" },
    { "question": "Explain photosynthesis.", "answer": "The process plants use to convert light energy into chemical energy." }
  ]
}
`;

		// Using fetch directly with OpenRouter API
		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.OPENROUTER_API_KEY || ''}`,
				'HTTP-Referer': env.APP_URL || 'http://localhost:5173', // Optional, helps OpenRouter identify usage
				'X-Title': 'FlashCarder App' // Optional
			},
			body: JSON.stringify({
				model: 'google/gemini-2.0-flash-thinking-exp:free', // Or specify a model known for good JSON output like 'mistralai/mistral-7b-instruct' if 'auto' fails.
				messages: [
					{
						role: 'system',
						content:
							'You are an AI assistant that generates flashcards from text and strictly follows JSON output format instructions.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.3, // Slightly increased temperature might help if it's being too rigid, but keep low for consistency
				max_tokens: 2500, // Increased slightly if needed
				response_format: { type: 'json_object' } // Crucial for enforcing JSON output
			})
		});

		if (!response.ok) {
			const errorText = await response.text(); // Get raw text for better debugging
			console.error('API Error Response:', errorText);
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		// Check if choices exist and have content
		if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
			console.error('Invalid AI response structure:', data);
			throw new Error('AI response did not contain expected content.');
		}

		let jsonResponse = data.choices[0].message.content;
		console.log('Raw AI Response:', jsonResponse);

		// Remove potential Markdown code fences
		if (jsonResponse.startsWith('```json')) {
			jsonResponse = jsonResponse.substring(7); // Remove ```json\n
			if (jsonResponse.endsWith('```')) {
				jsonResponse = jsonResponse.substring(0, jsonResponse.length - 3);
			}
		}
		// Trim any leading/trailing whitespace just in case
		jsonResponse = jsonResponse.trim();

		try {
			const parsedResponse = JSON.parse(jsonResponse); // Use the cleaned string

			// Expecting { "flashcards": [...] } based on the improved prompt
			if (parsedResponse.flashcards && Array.isArray(parsedResponse.flashcards)) {
				const flashcards: Flashcard[] = parsedResponse.flashcards;

				// Basic validation of flashcard structure
				return flashcards
					.filter((fc) => typeof fc.question === 'string' && typeof fc.answer === 'string')
					.map((fc) => ({
						question: fc.question,
						answer: fc.answer
					}));
			} else {
				console.error('Parsed response does not contain a "flashcards" array:', parsedResponse);
				throw new Error('AI response did not match the expected JSON structure.');
			}
		} catch (parseError) {
			console.error('Error parsing cleaned AI JSON response:', parseError); // Updated log message
			console.error('Failed JSON content (after cleaning):', jsonResponse); // Log the cleaned content
			// Fallback for when the response isn't proper JSON or doesn't match structure
			return [
				{
					question: 'Failed to generate structured flashcards',
					answer: 'The AI response could not be processed. Please check the logs or try again.'
				}
			];
		}
	} catch (error) {
		console.error('Error in generateFlashcards function:', error);
		// Return a more informative error or re-throw
		return [
			{
				question: 'Error during flashcard generation',
				answer: error instanceof Error ? error.message : 'An unknown error occurred.'
			}
		];
		// Or re-throw: throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : error}`);
	}
}
