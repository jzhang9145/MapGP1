import { z } from 'zod';

export const censusBlockSchema = z.object({
  id: z.string(),
  geoid: z.string().describe('15-digit Census Block GEOID identifier'),
  state: z.string().optional().describe('State FIPS code (36 for NY)'),
  county: z.string().optional().describe('County FIPS code (047 for Kings/Brooklyn)'),
  tract: z.string().optional().describe('Census tract code'),
  block: z.string().optional().describe('Census block code'),
  // Demographics
  totalPopulation: z.number().nullable().optional().describe('Total population in this census block'),
  totalHouseholds: z.number().nullable().optional().describe('Total number of households'),
  occupiedHouseholds: z.number().nullable().optional().describe('Number of occupied households'),
  vacantHouseholds: z.number().nullable().optional().describe('Number of vacant households'),
  medianHouseholdIncome: z.number().nullable().optional().describe('Median household income in dollars'),
  totalHousingUnits: z.number().nullable().optional().describe('Total number of housing units'),
  ownerOccupied: z.number().nullable().optional().describe('Number of owner-occupied housing units'),
  renterOccupied: z.number().nullable().optional().describe('Number of renter-occupied housing units'),
  medianAge: z.number().nullable().optional().describe('Median age of residents'),
  // Race/Ethnicity
  whiteAlone: z.number().nullable().optional().describe('Population identifying as White alone'),
  blackAlone: z.number().nullable().optional().describe('Population identifying as Black or African American alone'),
  asianAlone: z.number().nullable().optional().describe('Population identifying as Asian alone'),
  hispanicLatino: z.number().nullable().optional().describe('Population identifying as Hispanic or Latino'),
  // Education
  bachelorsOrHigher: z.number().nullable().optional().describe('Population with bachelor\'s degree or higher'),
  // Employment
  unemploymentRate: z.number().nullable().optional().describe('Unemployment rate as percentage'),
  // Geographic
  borough: z.string().optional().describe('Borough name (Brooklyn)'),
  geojson: z.any().describe('GeoJSON data for the census block boundary'),
});

export const censusResponseSchema = z.object({
  censusBlocks: z.array(censusBlockSchema).describe('Array of NYC census blocks'),
  summary: z.object({
    totalBlocks: z.number().describe('Total number of census blocks found'),
    totalPopulation: z.number().optional().describe('Sum of population across all blocks'),
    avgMedianIncome: z.number().optional().describe('Average median household income'),
    avgUnemploymentRate: z.number().optional().describe('Average unemployment rate'),
  }).optional().describe('Summary statistics for the census blocks'),
});

export type CensusBlock = z.infer<typeof censusBlockSchema>;
export type CensusResponse = z.infer<typeof censusResponseSchema>;