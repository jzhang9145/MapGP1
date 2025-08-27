import { z } from 'zod';

export const spatialResultSchema = z.object({
  id: z.string().describe('Unique identifier'),
  layerType: z
    .enum([
      'parks',
      'neighborhoods',
      'schoolZones',
      'censusBlocks',
      'properties',
    ])
    .describe('Type of spatial layer'),
  name: z.string().optional().describe('Name of the feature'),
  schoolName: z.string().optional().describe('School name (for school zones)'),
  dbn: z
    .string()
    .optional()
    .describe('District Borough Number (for school zones)'),
  signname: z.string().optional().describe('Sign name (for parks)'),
  borough: z.string().optional().describe('Borough name'),
  address: z.string().optional().describe('Address'),
  acreage: z.string().optional().describe('Acreage (for parks)'),
  schoolDistrict: z
    .string()
    .optional()
    .describe('School district (for school zones)'),
  typecategory: z.string().optional().describe('Type category (for parks)'),
  // Census block specific fields
  geoid: z
    .string()
    .optional()
    .describe('Census block GEOID (for census blocks)'),
  tract: z.string().optional().describe('Census tract (for census blocks)'),
  block: z
    .string()
    .optional()
    .describe('Census block number (for census blocks)'),
  totalPopulation: z
    .number()
    .nullable()
    .optional()
    .describe('Total population (for census blocks)'),
  medianHouseholdIncome: z
    .number()
    .nullable()
    .optional()
    .describe('Median household income (for census blocks)'),
  unemploymentRate: z
    .string()
    .nullable()
    .optional()
    .describe('Unemployment rate (for census blocks)'),
  // MapPLUTO property specific fields
  bbl: z
    .string()
    .optional()
    .describe('Borough-Block-Lot identifier (for properties)'),
  ownername: z
    .string()
    .optional()
    .describe('Property owner name (for properties)'),
  bldgclass: z.string().optional().describe('Building class (for properties)'),
  landuse: z.string().optional().describe('Land use code (for properties)'),
  zonedist1: z
    .string()
    .optional()
    .describe('Primary zoning district (for properties)'),
  assesstot: z
    .number()
    .nullable()
    .optional()
    .describe('Total assessed value (for properties)'),
  lotarea: z
    .number()
    .nullable()
    .optional()
    .describe('Lot area in sq ft (for properties)'),
  bldgarea: z
    .number()
    .nullable()
    .optional()
    .describe('Building area in sq ft (for properties)'),
  yearbuilt: z
    .number()
    .nullable()
    .optional()
    .describe('Year built (for properties)'),
  geojson: z
    .any()
    .optional()
    .describe('GeoJSON boundary data (deprecated - use geojsonDataId)'),
  geojsonDataId: z
    .string()
    .optional()
    .describe('Reference ID to fetch GeoJSON data from /api/geojson/[id]'),
  analysisQuery: z.string().describe('The spatial query that was performed'),
  spatialRelation: z.string().describe('Type of spatial relationship'),
  filterDescription: z.string().describe('Description of the filter used'),
});

export const spatialAnalysisResponseSchema = z.object({
  results: z
    .array(spatialResultSchema)
    .describe('Array of spatial analysis results'),
  query: z.string().describe('Description of the query performed'),
  totalResults: z.number().describe('Total number of results found'),
  spatialRelation: z.string().describe('Type of spatial relationship used'),
  filterDescription: z.string().describe('Description of the spatial filter'),
});

export type SpatialResult = z.infer<typeof spatialResultSchema>;
export type SpatialAnalysisResponse = z.infer<
  typeof spatialAnalysisResponseSchema
>;
