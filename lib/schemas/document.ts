import { z } from 'zod';

// Document creation response schema
export const documentCreationResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  content: z.string(),
});

// Document update response schema
export const documentUpdateResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  content: z.string(),
  error: z.string().optional(),
});

// Suggestion schema
export const suggestionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  originalText: z.string(),
  suggestedText: z.string(),
  description: z.string(),
  isResolved: z.boolean(),
});

// Suggestions response schema
export const suggestionsResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  message: z.string(),
  error: z.string().optional(),
});

export type DocumentCreationResponse = z.infer<typeof documentCreationResponseSchema>;
export type DocumentUpdateResponse = z.infer<typeof documentUpdateResponseSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>; 