import { tool } from 'ai';
import { mapplutoResponseSchema } from '@/lib/schemas';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import { getPropertyDescription, getPropertyIcon, formatAssessment, formatArea } from '@/lib/schemas/mappluto';

// Function to fetch MapPLUTO data directly from NYC APIs
async function fetchMapPLUTOFromAPI(filters: {
  searchTerm?: string;
  buildingClass?: string;
  landUse?: string;
  ownerType?: string;
  minAssessment?: number;
  maxAssessment?: number;
  minLotArea?: number;
  maxLotArea?: number;
  minBuildingArea?: number;
  maxBuildingArea?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minUnits?: number;
  maxUnits?: number;
  isVacant?: boolean;
  limit: number;
  sortBy: string;
}) {
  try {
    // NYC Open Data MapPLUTO API endpoint
    const baseUrl = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
    const params = new URLSearchParams();
    
    // Always filter to Brooklyn first
    params.append('borough', 'BK');
    
    // Add filters as SoQL query parameters
    const whereConditions: string[] = [];
    
    if (filters.buildingClass) {
      whereConditions.push(`bldgclass='${filters.buildingClass}'`);
    }
    
    if (filters.landUse) {
      whereConditions.push(`landuse='${filters.landUse}'`);
    }
    
    if (filters.ownerType) {
      whereConditions.push(`ownertype='${filters.ownerType}'`);
    }
    
    if (filters.minAssessment) {
      whereConditions.push(`assesstot>=${filters.minAssessment}`);
    }
    
    if (filters.maxAssessment) {
      whereConditions.push(`assesstot<=${filters.maxAssessment}`);
    }
    
    if (filters.minLotArea) {
      whereConditions.push(`lotarea>=${filters.minLotArea}`);
    }
    
    if (filters.maxLotArea) {
      whereConditions.push(`lotarea<=${filters.maxLotArea}`);
    }
    
    if (filters.minBuildingArea) {
      whereConditions.push(`bldgarea>=${filters.minBuildingArea}`);
    }
    
    if (filters.maxBuildingArea) {
      whereConditions.push(`bldgarea<=${filters.maxBuildingArea}`);
    }
    
    if (filters.minYearBuilt) {
      whereConditions.push(`yearbuilt>=${filters.minYearBuilt}`);
    }
    
    if (filters.maxYearBuilt) {
      whereConditions.push(`yearbuilt<=${filters.maxYearBuilt}`);
    }
    
    if (filters.minUnits) {
      whereConditions.push(`unitstotal>=${filters.minUnits}`);
    }
    
    if (filters.maxUnits) {
      whereConditions.push(`unitstotal<=${filters.maxUnits}`);
    }
    
    if (filters.isVacant) {
      whereConditions.push(`(bldgclass like 'V%' OR landuse='29')`);
    }
    
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.replace(/'/g, "''"); // Escape quotes
      whereConditions.push(`(bbl like '%${searchTerm}%' OR address like '%${searchTerm}%' OR ownername like '%${searchTerm}%')`);
    }
    
    // Add where conditions if any
    if (whereConditions.length > 0) {
      params.append('$where', whereConditions.join(' AND '));
    }
    
    // Add sorting
    let orderBy = 'assesstot DESC'; // Default to assessment
    if (filters.sortBy === 'area') {
      orderBy = 'lotarea DESC';
    } else if (filters.sortBy === 'yearBuilt') {
      orderBy = 'yearbuilt DESC';
    } else if (filters.sortBy === 'units') {
      orderBy = 'unitstotal DESC';
    }
    params.append('$order', orderBy);
    
    // Set limit
    params.append('$limit', Math.min(filters.limit, 1000).toString());
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log(`🔗 Fetching from NYC API: ${url.substring(0, 150)}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NYC API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from NYC API');
    }
    
    // Transform API response to match our schema
    return data.map((row: any) => ({
      id: row.bbl || '', // Use BBL as ID since it's unique
      bbl: row.bbl || '',
      borough: 'Brooklyn',
      block: row.block || null,
      lot: row.lot || null,
      cd: row.cd || null,
      bldgclass: row.bldgclass || null,
      landuse: row.landuse || null,
      ownertype: row.ownertype || null,
      ownername: row.ownername || null,
      lotarea: row.lotarea ? parseInt(row.lotarea) : null,
      bldgarea: row.bldgarea ? parseInt(row.bldgarea) : null,
      comarea: row.comarea ? parseInt(row.comarea) : null,
      resarea: row.resarea ? parseInt(row.resarea) : null,
      officearea: row.officearea ? parseInt(row.officearea) : null,
      retailarea: row.retailarea ? parseInt(row.retailarea) : null,
      garagearea: row.garagearea ? parseInt(row.garagearea) : null,
      strgearea: row.strgearea ? parseInt(row.strgearea) : null,
      factryarea: row.factryarea ? parseInt(row.factryarea) : null,
      otherarea: row.otherarea ? parseInt(row.otherarea) : null,
      areasource: row.areasource || null,
      numbldgs: row.numbldgs ? parseInt(row.numbldgs) : null,
      numfloors: row.numfloors ? parseFloat(row.numfloors) : null,
      unitsres: row.unitsres ? parseInt(row.unitsres) : null,
      unitstotal: row.unitstotal ? parseInt(row.unitstotal) : null,
      lotfront: row.lotfront ? parseFloat(row.lotfront) : null,
      lotdepth: row.lotdepth ? parseFloat(row.lotdepth) : null,
      bldgfront: row.bldgfront ? parseFloat(row.bldgfront) : null,
      bldgdepth: row.bldgdepth ? parseFloat(row.bldgdepth) : null,
      ext: row.ext || null,
      proxcode: row.proxcode || null,
      irrlotcode: row.irrlotcode || null,
      lottype: row.lottype || null,
      bsmtcode: row.bsmtcode || null,
      assessland: row.assessland ? parseInt(row.assessland) : null,
      assesstot: row.assesstot ? parseInt(row.assesstot) : null,
      exempttot: row.exempttot ? parseInt(row.exempttot) : null,
      yearbuilt: row.yearbuilt ? parseInt(row.yearbuilt) : null,
      yearalter1: row.yearalter1 ? parseInt(row.yearalter1) : null,
      yearalter2: row.yearalter2 ? parseInt(row.yearalter2) : null,
      histdist: row.histdist || null,
      landmark: row.landmark || null,
      builtfar: row.builtfar ? parseFloat(row.builtfar) : null,
      residfar: row.residfar ? parseFloat(row.residfar) : null,
      commfar: row.commfar ? parseFloat(row.commfar) : null,
      facilfar: row.facilfar ? parseFloat(row.facilfar) : null,
      borocode: row.borocode || null,
      condono: row.condono || null,
      tract2010: row.tract2010 || null,
      xcoord: row.xcoord ? parseInt(row.xcoord) : null,
      ycoord: row.ycoord ? parseInt(row.ycoord) : null,
      zonemap: row.zonemap || null,
      zmcode: row.zmcode || null,
      sanborn: row.sanborn || null,
      taxmap: row.taxmap || null,
      edesignum: row.edesignum || null,
      appbbl: row.appbbl || null,
      appdate: row.appdate || null,
      plutomapid: row.plutomapid || null,
      version: row.version || null,
      address: row.address || null,
      zipcode: row.zipcode || null,
      geojsonDataId: null, // No geometry from this API
      geojson: null, // No geometry from this simple API call
    }));
    
  } catch (error) {
    console.error('❌ Error fetching from NYC API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch MapPLUTO data from NYC API: ${errorMessage}`);
  }
}

// Optional: Function to get geometry data from ArcGIS if needed
async function fetchGeometryFromArcGIS(bbl: string) {
  try {
    const arcgisUrl = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query';
    const params = new URLSearchParams({
      where: `BBL = '${bbl}'`,
      geometryType: "esriGeometryPolygon",
      returnGeometry: 'true',
      outSR: '4326',
      f: 'geojson',
      outFields: 'BBL'
    });

    const response = await fetch(`${arcgisUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`ArcGIS API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.features?.[0] || null;
  } catch (error) {
    console.error(`❌ Error fetching geometry for BBL ${bbl}:`, error);
    return null;
  }
}

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
  }): Promise<z.infer<typeof mapplutoResponseSchema>> => {
    try {
      console.log('🏗️ Querying MapPLUTO properties directly from NYC API...', {
        searchTerm,
        buildingClass,
        landUse,
        minAssessment,
        maxAssessment,
        limit
      });

      // Fetch data directly from NYC Open Data API
      const results = await fetchMapPLUTOFromAPI({
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
        isVacant,
        limit,
        sortBy
      });

      console.log(`🏢 Found ${results.length} properties from API`);

      // Results are already filtered and sorted by the API
      const limitedResults = results;

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
