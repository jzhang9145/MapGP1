import { z } from 'zod';

// JSON reader response schema
export const jsonReaderResponseSchema = z.object({
  success: z.boolean().optional(),
  url: z.string(),
  contentType: z.string().optional(),
  contentLength: z.number().optional(),
  dataType: z.string().optional(),
  isArray: z.boolean().optional(),
  arrayLength: z.number().optional(),
  keys: z.array(z.string()).optional(),
  preview: z.any().optional(),
  geojsonType: z.string().optional(),
  featureCount: z.number().optional(),
  featureNames: z.array(z.string()).optional(),
  previewFeatures: z.array(z.object({
    type: z.string(),
    properties: z.any(),
    geometry: z.string().optional(),
  })).optional(),
  featureName: z.string().optional(),
  geometryType: z.string().optional(),
  extractedFields: z.record(z.any()).optional(),
  error: z.string().optional(),
  details: z.string().optional(),
});

export type JsonReaderResponse = z.infer<typeof jsonReaderResponseSchema>; 