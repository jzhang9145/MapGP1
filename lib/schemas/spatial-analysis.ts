import { z } from 'zod';

export const spatialResultSchema = z.object({
  id: z.string().describe('Unique identifier'),
  layerType: z.enum(['parks', 'neighborhoods', 'schoolZones']).describe('Type of spatial layer'),
  name: z.string().optional().describe('Name of the feature'),
  schoolName: z.string().optional().describe('School name (for school zones)'),
  dbn: z.string().optional().describe('District Borough Number (for school zones)'),
  signname: z.string().optional().describe('Sign name (for parks)'),
  borough: z.string().optional().describe('Borough name'),
  address: z.string().optional().describe('Address'),
  acreage: z.string().optional().describe('Acreage (for parks)'),
  schoolDistrict: z.string().optional().describe('School district (for school zones)'),
  typecategory: z.string().optional().describe('Type category (for parks)'),
  geojson: z.any().describe('GeoJSON boundary data'),
  analysisQuery: z.string().describe('The spatial query that was performed'),
  spatialRelation: z.string().describe('Type of spatial relationship'),
  filterDescription: z.string().describe('Description of the filter used'),
});

export const spatialAnalysisResponseSchema = z.object({
  results: z.array(spatialResultSchema).describe('Array of spatial analysis results'),
  query: z.string().describe('Description of the query performed'),
  totalResults: z.number().describe('Total number of results found'),
  spatialRelation: z.string().describe('Type of spatial relationship used'),
  filterDescription: z.string().describe('Description of the spatial filter'),
});

export type SpatialResult = z.infer<typeof spatialResultSchema>;
export type SpatialAnalysisResponse = z.infer<typeof spatialAnalysisResponseSchema>;