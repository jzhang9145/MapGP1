import { z } from 'zod';

// Base neighborhood data schema
export const neighborhoodDataSchema = z.object({
  name: z.string(),
  geojsonDataId: z.string(),
  borough: z.string().optional(),
  nta_code: z.string().optional(),
  nta_name: z.string().optional(),
  nta_2020: z.string().optional(),
  cdtca: z.string().optional(),
  cdtca_name: z.string().optional(),
  center: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  shape_area: z.string().optional(),
  shape_leng: z.string().optional(),
});

export type NeighborhoodData = z.infer<typeof neighborhoodDataSchema>;
