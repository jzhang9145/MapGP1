import { tool } from 'ai';
import { z } from 'zod';
import { webSearchResponseSchema, type WebSearchResponse } from '@/lib/schemas';

export const webSearch = tool({
  description:
    'Search the web for current information, news, or facts. Use this when you need to find up-to-date information that might not be in your training data.',
  inputSchema: z.object({
    query: z.string().describe('The search query to look up on the web'),
  }),
  outputSchema: webSearchResponseSchema,
  execute: async ({ query }): Promise<WebSearchResponse> => {
    if (!process.env.SERPER_API_KEY) {
      return {
        query,
        error: 'Serper API key not configured',
        results: [],
      };
    }

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 5, // Limit to 5 results for efficiency
        }),
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract and format the search results
      const results =
        data.organic?.map((result: any) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
        })) || [];

      return {
        query,
        results,
        totalResults: data.searchInformation?.totalResults || 0,
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        query,
        error: 'Failed to perform web search',
        results: [],
      };
    }
  },
});
