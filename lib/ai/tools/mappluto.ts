import { tool } from 'ai';
import { mapplutoResponseSchema } from '@/lib/schemas';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import { getAllMapPLUTO } from '@/lib/db/queries';
import { getPropertyDescription, getPropertyIcon, formatAssessment, formatArea } from '@/lib/schemas/mappluto';

export const mappluto = tool({
  description: `
    Query NYC MapPLUTO tax lot data for Brooklyn properties with detailed information.
    This tool provides comprehensive property data including ownership, assessments, building details,
    zoning information, and development potential.
    
    Use this tool to find properties by various criteria:
    - Property type (residential, commercial, office, industrial, vacant)
    - Assessment value ranges
    - Building characteristics (size, age, units)
    - Ownership information
    - Zoning and development potential
    
    Examples:
    - "Find vacant lots suitable for development"
    - "Properties with assessment over $10M"
    - "Single family homes built after 2000"
    - "Commercial properties owned by LLC"
    - "Find properties with high development potential"
    - "Search by specific address or BBL"
    
    NOTE: For neighborhood-based queries like "properties in [neighborhood]", 
    use the spatialAnalysis tool instead for proper geographic intersection.
  `,
  inputSchema: z.object({
    // Search filters
    searchTerm: z.string().optional().describe('Search BBL, address, or owner name'),
    
    // Property classification
    buildingClass: z.string().optional().describe('Building class (A1=single family, O4=office, R4=condo, V9=vacant, etc.)'),
    landUse: z.string().optional().describe('Land use code (01=family homes, 13=office, 29=vacant, etc.)'),
    ownerType: z.string().optional().describe('Owner type (P=private, C=city, etc.)'),
    
    // Assessment filters
    minAssessment: z.number().int().min(0).optional().describe('Minimum total assessment value'),
    maxAssessment: z.number().int().min(0).optional().describe('Maximum total assessment value'),
    
    // Size filters
    minLotArea: z.number().int().min(0).optional().describe('Minimum lot area in sq ft'),
    maxLotArea: z.number().int().min(0).optional().describe('Maximum lot area in sq ft'),
    minBuildingArea: z.number().int().min(0).optional().describe('Minimum building area in sq ft'),
    maxBuildingArea: z.number().int().min(0).optional().describe('Maximum building area in sq ft'),
    
    // Building characteristics
    minYearBuilt: z.number().int().min(1800).max(2024).optional().describe('Minimum year built'),
    maxYearBuilt: z.number().int().min(1800).max(2024).optional().describe('Maximum year built'),
    minUnits: z.number().int().min(0).optional().describe('Minimum number of units'),
    maxUnits: z.number().int().min(0).optional().describe('Maximum number of units'),
    
    // Development potential
    hasHighFAR: z.boolean().optional().describe('Properties with significant unused FAR (development potential)'),
    isVacant: z.boolean().optional().describe('Vacant lots only'),
    
    // Results
    limit: z.number().int().min(1).max(50).default(20).describe('Maximum number of properties to return'),
    sortBy: z.enum(['assessment', 'area', 'yearBuilt', 'units']).default('assessment').describe('Sort results by'),
  }),
  outputSchema: mapplutoResponseSchema,
  execute: async ({ 
    searchTerm,
    buildingClass,
    landUse,
    ownerType,
    minAssessment,
    maxAssessment,
    minLotArea,
    maxLotArea,
    minBuildingArea,
    maxBuildingArea,
    minYearBuilt,
    maxYearBuilt,
    minUnits,
    maxUnits,
    hasHighFAR,
    isVacant,
    limit = 20,
    sortBy = 'assessment'
  }) => {
    try {
      console.log('🏗️ Querying MapPLUTO properties...', {
        searchTerm,
        buildingClass,
        landUse,
        minAssessment,
        maxAssessment,
        limit
      });

      // For now, use the basic query function
      const results = await getAllMapPLUTO({ limit });

      console.log(`🏢 Found ${results.length} properties`);

      // Apply client-side filtering for now
      let filteredResults = results;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredResults = filteredResults.filter(prop =>
          prop.bbl?.includes(searchTerm) ||
          prop.address?.toLowerCase().includes(searchLower) ||
          prop.ownername?.toLowerCase().includes(searchLower) ||
          // Add building class descriptions for better search
          (searchLower.includes('office') && ['O', 'I'].some(prefix => prop.bldgclass?.startsWith(prefix))) ||
          (searchLower.includes('residential') && ['R', 'A', 'B', 'C', 'D'].some(prefix => prop.bldgclass?.startsWith(prefix))) ||
          (searchLower.includes('commercial') && ['K', 'M', 'O', 'S'].some(prefix => prop.bldgclass?.startsWith(prefix))) ||
          (searchLower.includes('building') && prop.bldgclass && !prop.bldgclass.startsWith('V')) ||
          (searchLower.includes('brooklyn') && prop.borough === 'Brooklyn') ||
          (searchLower.includes('vacant') && (prop.bldgclass?.startsWith('V') || prop.landuse === '29'))
        );
      }
      
      if (buildingClass) {
        filteredResults = filteredResults.filter(prop => prop.bldgclass === buildingClass);
      }
      
      if (landUse) {
        filteredResults = filteredResults.filter(prop => prop.landuse === landUse);
      }
      
      if (ownerType) {
        filteredResults = filteredResults.filter(prop => prop.ownertype === ownerType);
      }
      
      if (minAssessment) {
        filteredResults = filteredResults.filter(prop => (prop.assesstot || 0) >= minAssessment);
      }
      
      if (maxAssessment) {
        filteredResults = filteredResults.filter(prop => (prop.assesstot || 0) <= maxAssessment);
      }
      
      if (isVacant) {
        filteredResults = filteredResults.filter(prop => 
          prop.bldgclass?.startsWith('V') || prop.landuse === '29'
        );
      }

      // Sort results
      if (sortBy === 'assessment') {
        filteredResults.sort((a, b) => (b.assesstot || 0) - (a.assesstot || 0));
      } else if (sortBy === 'area') {
        filteredResults.sort((a, b) => (b.lotarea || 0) - (a.lotarea || 0));
      } else if (sortBy === 'yearBuilt') {
        filteredResults.sort((a, b) => (b.yearbuilt || 0) - (a.yearbuilt || 0));
      } else if (sortBy === 'units') {
        filteredResults.sort((a, b) => (b.unitstotal || 0) - (a.unitstotal || 0));
      }

      // Apply limit
      const limitedResults = filteredResults.slice(0, limit);

      // Calculate summary statistics
      const totalAssessedValue = limitedResults.reduce((sum, prop) => sum + (prop.assesstot || 0), 0);
      const avgAssessment = limitedResults.length > 0 ? totalAssessedValue / limitedResults.length : 0;
      
      const lotsWithArea = limitedResults.filter(p => p.lotarea);
      const avgLotSize = lotsWithArea.length > 0 
        ? lotsWithArea.reduce((sum, p) => sum + (p.lotarea || 0), 0) / lotsWithArea.length 
        : 0;
      
      const buildingsWithYear = limitedResults.filter(p => p.yearbuilt);
      const avgYearBuilt = buildingsWithYear.length > 0
        ? buildingsWithYear.reduce((sum, p) => sum + (p.yearbuilt || 0), 0) / buildingsWithYear.length
        : 0;

      // Count by property types
      const propertyTypes: Record<string, number> = {};
      limitedResults.forEach(prop => {
        const key = prop.bldgclass || 'Unknown';
        propertyTypes[key] = (propertyTypes[key] || 0) + 1;
      });

      return {
        properties: limitedResults,
        summary: {
          totalProperties: limitedResults.length,
          avgAssessment: avgAssessment > 0 ? Math.round(avgAssessment) : undefined,
          avgLotSize: avgLotSize > 0 ? Math.round(avgLotSize) : undefined,
          avgYearBuilt: avgYearBuilt > 0 ? Math.round(avgYearBuilt) : undefined,
          propertyTypes,
          totalAssessedValue: totalAssessedValue > 0 ? totalAssessedValue : undefined,
        },
      };

    } catch (error) {
      console.error('❌ Error fetching MapPLUTO data:', error);
      throw new ChatSDKError('bad_request:database', 'Failed to fetch property data');
    }
  },
});
