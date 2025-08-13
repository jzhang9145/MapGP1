import { z } from 'zod';

// Schema for individual school zone data
export const schoolZoneSchema = z.object({
  id: z.string(),
  dbn: z.string().describe('District Borough Number (e.g., "20K503")'),
  schoolName: z.string().optional().describe('Name of the school'),
  schoolDistrict: z.string().describe('School district number'),
  borough: z.string().describe('Borough code (K, M, Q, X, R)'),
  boroNum: z.string().describe('Borough number'),
  label: z.string().optional().describe('Zone label with school information'),
  initials: z.string().optional().describe('School initials'),
  zonedDist: z.string().optional().describe('Zoned district'),
  esidNo: z.string().optional().describe('ESID number'),
  shapeArea: z.string().optional().describe('Area of the zone'),
  shapeLength: z.string().optional().describe('Perimeter of the zone'),
  remarks: z.string().optional().describe('Additional information about the zone'),
  geojsonDataId: z.string().optional().describe('Reference to GeoJSON boundary data'),
  geojson: z.any().optional().describe('GeoJSON geometry for the school zone boundary'),
});

export type SchoolZone = z.infer<typeof schoolZoneSchema>;

// Schema for school zones search response
export const schoolZonesResponseSchema = z.object({
  success: z.boolean(),
  source: z.string().default('NYC Department of Education'),
  query: z.string().optional(),
  totalResults: z.number(),
  zones: z.array(schoolZoneSchema),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type SchoolZonesResponse = z.infer<typeof schoolZonesResponseSchema>;

// Schema for school zone search parameters
export const schoolZoneSearchSchema = z.object({
  searchTerm: z.string().optional().describe('Search for school name, DBN, or label'),
  borough: z.string().optional().describe('Filter by borough (K, M, Q, X, R)'),
  district: z.string().optional().describe('Filter by school district number'),
  dbn: z.string().optional().describe('Search for specific District Borough Number'),
  limit: z.number().min(1).max(100).default(50).describe('Maximum number of results'),
  includeGeometry: z.boolean().default(true).describe('Include GeoJSON boundary data'),
});

export type SchoolZoneSearch = z.infer<typeof schoolZoneSearchSchema>;