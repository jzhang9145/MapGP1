import { z } from 'zod';

// Web search result schema
export const webSearchResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
});

// Web search response schema
export const webSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(webSearchResultSchema),
  totalResults: z.number().optional(),
  error: z.string().optional(),
});

export type WebSearchResult = z.infer<typeof webSearchResultSchema>;
export type WebSearchResponse = z.infer<typeof webSearchResponseSchema>; 