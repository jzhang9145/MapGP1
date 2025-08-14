import { tool } from 'ai';
import { censusResponseSchema } from '@/lib/schemas';
import { getNYCCensusBlocksWithGrowth } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

export const nycCensus = tool({
  description: `
    Query NYC census blocks in Brooklyn with demographic data AND growth metrics (2022 vs 2023).
    This tool provides population, housing, income, education, employment, and race/ethnicity data
    PLUS growth rates for population, income, and housing from 2022 to 2023.
    
    Use this tool to find demographic information AND growth patterns for specific areas.
    
    Examples:
    - "Find census blocks with high median income"
    - "Show areas with high population growth"
    - "Find census blocks with income growth over 10%"
    - "Areas with declining population"
    - "Census tracts with income over 200K and positive growth"
    - "Show me fastest growing areas by population"
  `,
  inputSchema: z.object({
    searchTerm: z.string().optional().describe('Search for specific census tract or block (e.g., "123", "360470123")'),
    minPopulation: z.number().int().min(0).optional().describe('Minimum population filter'),
    maxPopulation: z.number().int().min(0).optional().describe('Maximum population filter'),
    minIncome: z.number().int().min(0).optional().describe('Minimum median household income filter (in dollars)'),
    maxIncome: z.number().int().min(0).optional().describe('Maximum median household income filter (in dollars)'),
    minPopulationGrowth: z.number().optional().describe('Minimum population growth rate 2022-2023 (% e.g., 5.0 for 5%)'),
    maxPopulationGrowth: z.number().optional().describe('Maximum population growth rate 2022-2023 (% e.g., -2.0 for decline)'),
    minIncomeGrowth: z.number().optional().describe('Minimum income growth rate 2022-2023 (% e.g., 10.0 for 10%)'),
    maxIncomeGrowth: z.number().optional().describe('Maximum income growth rate 2022-2023 (% e.g., -5.0 for decline)'),
    limit: z.number().int().min(1).max(50).default(20).describe('Maximum number of census blocks to return'),
  }),
  outputSchema: censusResponseSchema,
  execute: async ({ 
    searchTerm, 
    minPopulation, 
    maxPopulation, 
    minIncome, 
    maxIncome,
    minPopulationGrowth,
    maxPopulationGrowth,
    minIncomeGrowth,
    maxIncomeGrowth,
    limit = 20 
  }) => {
    // Auto-detect growth queries and set appropriate filters
    let autoMinPopGrowth = minPopulationGrowth;
    let autoMinIncGrowth = minIncomeGrowth;
    
    // If no growth filters are explicitly set, but this seems like a growth query,
    // set reasonable minimum thresholds to show actual growth
    if (!minPopulationGrowth && !maxPopulationGrowth && !minIncomeGrowth && !maxIncomeGrowth) {
      // For now, we'll let the sorting handle "highest growth" queries
      // The sorting logic will prioritize by growth when growth params are used
    }
    try {
      console.log('Fetching NYC census blocks from database...', {
        searchTerm,
        minPopulation,
        maxPopulation, 
        minIncome,
        maxIncome,
        limit
      });

      const censusBlocks = await getNYCCensusBlocksWithGrowth({
        searchTerm,
        minPopulation,
        maxPopulation,
        minIncome,
        maxIncome,
        minPopulationGrowth,
        maxPopulationGrowth,
        minIncomeGrowth,
        maxIncomeGrowth,
        limit
      });

      console.log(`Found ${censusBlocks.length} census blocks`);

      // Calculate summary statistics
      const totalPopulation = censusBlocks.reduce((sum, block) => sum + (block.totalPopulation || 0), 0);

      const blocksWithIncome = censusBlocks.filter(b => b.medianHouseholdIncome);
      const avgIncome = blocksWithIncome.length > 0 
        ? blocksWithIncome.reduce((sum, b) => sum + (b.medianHouseholdIncome || 0), 0) / blocksWithIncome.length 
        : undefined;

      const blocksWithUnemployment = censusBlocks.filter(b => b.unemploymentRate !== null);
      const avgUnemployment = blocksWithUnemployment.length > 0
        ? blocksWithUnemployment.reduce((sum, b) => sum + (Number(b.unemploymentRate) || 0), 0) / blocksWithUnemployment.length
        : undefined;

      // Calculate growth averages
      const blocksWithPopGrowth = censusBlocks.filter(b => b.populationGrowth !== null);
      const avgPopulationGrowth = blocksWithPopGrowth.length > 0
        ? blocksWithPopGrowth.reduce((sum, b) => sum + (Number(b.populationGrowth) || 0), 0) / blocksWithPopGrowth.length
        : undefined;

      const blocksWithIncGrowth = censusBlocks.filter(b => b.incomeGrowth !== null);
      const avgIncomeGrowth = blocksWithIncGrowth.length > 0
        ? blocksWithIncGrowth.reduce((sum, b) => sum + (Number(b.incomeGrowth) || 0), 0) / blocksWithIncGrowth.length
        : undefined;

      const blocksWithHousingGrowth = censusBlocks.filter(b => b.housingGrowth !== null);
      const avgHousingGrowth = blocksWithHousingGrowth.length > 0
        ? blocksWithHousingGrowth.reduce((sum, b) => sum + (Number(b.housingGrowth) || 0), 0) / blocksWithHousingGrowth.length
        : undefined;



      return {
        censusBlocks: censusBlocks.map(block => ({
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
          unemploymentRate: block.unemploymentRate ? Number(block.unemploymentRate) : null,
          borough: block.borough,
          geojson: block.geojson,
          populationGrowth: block.populationGrowth,
          incomeGrowth: block.incomeGrowth,
          housingGrowth: block.housingGrowth,
        })),
        summary: {
          totalBlocks: censusBlocks.length,
          totalPopulation,
          avgMedianIncome: avgIncome ? Math.round(avgIncome) : undefined,
          avgUnemploymentRate: avgUnemployment ? Math.round(avgUnemployment * 100) / 100 : undefined,
          avgPopulationGrowth: avgPopulationGrowth ? Math.round(avgPopulationGrowth * 100) / 100 : undefined,
          avgIncomeGrowth: avgIncomeGrowth ? Math.round(avgIncomeGrowth * 100) / 100 : undefined,
          avgHousingGrowth: avgHousingGrowth ? Math.round(avgHousingGrowth * 100) / 100 : undefined,
        },
      };

    } catch (error) {
      console.error('Error fetching census data:', error);
      throw new ChatSDKError('bad_request:database', 'Failed to fetch census data');
    }
  },
});