import { tool } from 'ai';
import { censusResponseSchema } from '@/lib/schemas';
import { getNYCCensusBlocksWithGrowth } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

export const nycCensus = tool({
  description: `
    Query NYC census blocks in Brooklyn with comprehensive demographic data from the 2023 American Community Survey.
    This tool provides population, housing, income, education, employment, and race/ethnicity data
    for census blocks with geographic boundaries.
    
    Use this tool to find demographic information for specific areas.
    
    Examples:
    - "Find census blocks with high median income"
    - "Show areas with low unemployment rate" 
    - "Find census blocks with income over $100K"
    - "Areas with high Asian population"
    - "Census tracts with high education levels"
    - "Show me areas with young median age"
  `,
  inputSchema: z.object({
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search for specific census tract or block (e.g., "123", "360470123")',
      ),
    minPopulation: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Minimum population filter'),
    maxPopulation: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Maximum population filter'),
    minIncome: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Minimum median household income filter (in dollars)'),
    maxIncome: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Maximum median household income filter (in dollars)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(20)
      .describe('Maximum number of census blocks to return'),
  }),
  outputSchema: censusResponseSchema,
  execute: async ({
    searchTerm,
    minPopulation,
    maxPopulation,
    minIncome,
    maxIncome,
    limit = 20,
  }) => {
    try {
      console.log('Fetching NYC census blocks from database...', {
        searchTerm,
        minPopulation,
        maxPopulation,
        minIncome,
        maxIncome,
        limit,
      });

      const censusBlocks = await getNYCCensusBlocksWithGrowth({
        searchTerm,
        minPopulation,
        maxPopulation,
        minIncome,
        maxIncome,
        limit,
      });

      console.log(`Found ${censusBlocks.length} census blocks`);

      // Calculate summary statistics
      const totalPopulation = censusBlocks.reduce(
        (sum, block) => sum + (block.totalPopulation || 0),
        0,
      );

      const blocksWithIncome = censusBlocks.filter(
        (b) => b.medianHouseholdIncome,
      );
      const avgIncome =
        blocksWithIncome.length > 0
          ? blocksWithIncome.reduce(
              (sum, b) => sum + (b.medianHouseholdIncome || 0),
              0,
            ) / blocksWithIncome.length
          : undefined;

      const blocksWithUnemployment = censusBlocks.filter(
        (b) => b.unemploymentRate !== null,
      );
      const avgUnemployment =
        blocksWithUnemployment.length > 0
          ? blocksWithUnemployment.reduce(
              (sum, b) => sum + (Number(b.unemploymentRate) || 0),
              0,
            ) / blocksWithUnemployment.length
          : undefined;

      // Growth data not available in current schema

      return {
        censusBlocks: censusBlocks.map((block) => ({
          id: block.id,
          geoid: block.geoid,
          state: block.state,
          county: block.county,
          tract: block.tract,
          block: block.block,
          totalPopulation: block.totalPopulation,
          totalHouseholds: block.totalHouseholds,
          occupiedHouseholds: block.occupiedHouseholds,
          vacantHouseholds: block.vacantHouseholds,
          medianHouseholdIncome: block.medianHouseholdIncome,
          totalHousingUnits: block.totalHousingUnits,
          ownerOccupied: block.ownerOccupied,
          renterOccupied: block.renterOccupied,
          medianAge: block.medianAge ? Number(block.medianAge) : null,
          whiteAlone: block.whiteAlone,
          blackAlone: block.blackAlone,
          asianAlone: block.asianAlone,
          hispanicLatino: block.hispanicLatino,
          bachelorsOrHigher: block.bachelorsOrHigher,
          unemploymentRate: block.unemploymentRate
            ? Number(block.unemploymentRate)
            : null,
          borough: block.borough,
          geojson: block.geojson,
        })),
        summary: {
          totalBlocks: censusBlocks.length,
          totalPopulation,
          avgMedianIncome: avgIncome ? Math.round(avgIncome) : undefined,
          avgUnemploymentRate: avgUnemployment
            ? Math.round(avgUnemployment * 100) / 100
            : undefined,
        },
      };
    } catch (error) {
      console.error('Error fetching census data:', error);
      throw new ChatSDKError(
        'bad_request:database',
        'Failed to fetch census data',
      );
    }
  },
});
