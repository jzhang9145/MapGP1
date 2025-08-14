import { tool } from 'ai';
import { censusResponseSchema } from '@/lib/schemas';
import { getNYCCensusBlocksWithGeoJSON } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

export const nycCensus = tool({
  description: `
    Query NYC census blocks in Brooklyn with detailed demographic data from the American Community Survey 2023.
    This tool provides population, housing, income, education, employment, and race/ethnicity data for census blocks.
    Census blocks are the smallest geographic units used by the U.S. Census Bureau.
    
    Use this tool to find demographic information for specific areas, analyze population patterns,
    or discover census blocks that meet specific criteria (e.g., high income, certain population ranges).
    
    Examples:
    - "Find census blocks with high median income"
    - "Show me census blocks with large populations" 
    - "Census data for tract 123"
    - "Demographics for areas with over $100k median income"
  `,
  inputSchema: z.object({
    searchTerm: z.string().optional().describe('Search for specific census tract or block (e.g., "123", "360470123")'),
    minPopulation: z.number().int().min(0).optional().describe('Minimum population filter'),
    maxPopulation: z.number().int().min(0).optional().describe('Maximum population filter'),
    minIncome: z.number().int().min(0).optional().describe('Minimum median household income filter (in dollars)'),
    maxIncome: z.number().int().min(0).optional().describe('Maximum median household income filter (in dollars)'),
    limit: z.number().int().min(1).max(50).default(20).describe('Maximum number of census blocks to return'),
  }),
  outputSchema: censusResponseSchema,
  execute: async ({ searchTerm, minPopulation, maxPopulation, minIncome, maxIncome, limit = 20 }) => {
    try {
      console.log('Fetching NYC census blocks from database...', {
        searchTerm,
        minPopulation,
        maxPopulation, 
        minIncome,
        maxIncome,
        limit
      });

      // Get census blocks with GeoJSON data
      const censusBlocks = await getNYCCensusBlocksWithGeoJSON({
        searchTerm,
        minPopulation,
        maxPopulation,
        minIncome,
        maxIncome,
        limit,
      });

      console.log(`Found ${censusBlocks.length} census blocks`);

      // Calculate summary statistics
      let totalPopulation = 0;
      let totalIncomeData = 0;
      let incomeCount = 0;
      let totalUnemploymentData = 0;
      let unemploymentCount = 0;

      const processedBlocks = censusBlocks.map(block => {
        // Add to summary calculations
        if (block.totalPopulation) {
          totalPopulation += block.totalPopulation;
        }
        if (block.medianHouseholdIncome) {
          totalIncomeData += block.medianHouseholdIncome;
          incomeCount++;
        }
        if (block.unemploymentRate) {
          totalUnemploymentData += parseFloat(block.unemploymentRate);
          unemploymentCount++;
        }

        return {
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
          medianAge: block.medianAge ? parseFloat(block.medianAge) : null,
          whiteAlone: block.whiteAlone,
          blackAlone: block.blackAlone,
          asianAlone: block.asianAlone,
          hispanicLatino: block.hispanicLatino,
          bachelorsOrHigher: block.bachelorsOrHigher,
          unemploymentRate: block.unemploymentRate ? parseFloat(block.unemploymentRate) : null,
          borough: block.borough,
          geojson: block.geojson,
        };
      });

      const summary = {
        totalBlocks: processedBlocks.length,
        totalPopulation: totalPopulation > 0 ? totalPopulation : undefined,
        avgMedianIncome: incomeCount > 0 ? Math.round(totalIncomeData / incomeCount) : undefined,
        avgUnemploymentRate: unemploymentCount > 0 ? 
          Math.round((totalUnemploymentData / unemploymentCount) * 100) / 100 : undefined,
      };

      return {
        censusBlocks: processedBlocks,
        summary,
      };
    } catch (error) {
      console.error('Error in nycCensus tool:', error);
      throw new ChatSDKError(
        'bad_request:api',
        `Failed to fetch NYC census data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});