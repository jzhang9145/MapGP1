import { tool } from 'ai';
import { z } from 'zod';
import {
  getAllNYCSchoolZones,
  getNYCSchoolZonesByBorough,
  searchNYCSchoolZones,
  getNYCSchoolZoneByDbn,
  createGeoJSONData,
  getGeoJSONDataById,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import {
  schoolZonesResponseSchema,
  type SchoolZonesResponse,
} from '@/lib/schemas';

export const nycSchoolZones = tool({
  description:
    'Get NYC elementary school zone data from the local database. Returns school zone boundaries, district information, and school details for New York City elementary schools. This tool provides access to official NYC Department of Education school zone boundaries with complete GeoJSON data for mapping.',
  inputSchema: z.object({
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search for school name, DBN (District Borough Number), or zone label',
      ),
    borough: z
      .string()
      .optional()
      .describe(
        'Filter by specific borough (K=Brooklyn, M=Manhattan, Q=Queens, X=Bronx, R=Staten Island)',
      ),
    district: z
      .string()
      .optional()
      .describe('Filter by school district number (e.g., "20", "19")'),
    dbn: z
      .string()
      .optional()
      .describe(
        'Search for specific District Borough Number (e.g., "20K503", "19K159")',
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of school zones to return (default: 50)'),
    includeGeometry: z
      .boolean()
      .optional()
      .describe('Include GeoJSON boundary data for mapping (default: true)'),
  }),
  outputSchema: schoolZonesResponseSchema,
  execute: async ({
    searchTerm,
    borough,
    district,
    dbn,
    limit = 50,
    includeGeometry = true,
  }): Promise<SchoolZonesResponse> => {
    try {
      console.log('Fetching NYC school zones from database...', {
        searchTerm,
        borough,
        district,
        dbn,
        limit,
      });

      let zones;

      // If specific DBN is requested, get that zone
      if (dbn) {
        const zone = await getNYCSchoolZoneByDbn({ dbn });
        zones = zone ? [zone] : [];
      }
      // If search term, borough, or district provided, use search
      else if (searchTerm || borough || district) {
        zones = await searchNYCSchoolZones({
          searchTerm,
          borough: borough?.toUpperCase(),
          district,
          limit,
        });
      }
      // If specific borough requested
      else if (borough) {
        zones = await getNYCSchoolZonesByBorough({
          borough: borough.toUpperCase(),
          limit,
        });
      }
      // Otherwise get all zones
      else {
        zones = await getAllNYCSchoolZones({ limit });
      }

      if (!zones || zones.length === 0) {
        throw new ChatSDKError(
          'bad_request:api',
          'No NYC school zones found matching the criteria',
        );
      }

      console.log(`Found ${zones.length} school zones`);

      // Enrich zones with GeoJSON data if requested
      const enrichedZones = [];
      for (const zone of zones) {
        let enrichedZone = { ...zone };

        if (includeGeometry && zone.geojsonDataId) {
          try {
            const geoData = await getGeoJSONDataById({
              id: zone.geojsonDataId,
            });
            if (geoData?.data) {
              enrichedZone.geojson = geoData.data;
            }
          } catch (error) {
            console.warn(
              `Failed to fetch geometry for zone ${zone.dbn}:`,
              error,
            );
          }
        }

        enrichedZones.push(enrichedZone);
      }

      // Build summary message
      let message = `Found ${zones.length} NYC elementary school zone${zones.length === 1 ? '' : 's'}`;
      if (borough) {
        const boroughName = getBoroughName(borough);
        message += ` in ${boroughName}`;
      }
      if (district) {
        message += ` in District ${district}`;
      }
      if (searchTerm) {
        message += ` matching "${searchTerm}"`;
      }
      if (dbn) {
        message += ` for ${dbn}`;
      }

      return {
        success: true,
        source: 'NYC Department of Education',
        query: searchTerm || dbn || `${borough || 'All'} ${district || ''}`,
        totalResults: zones.length,
        zones: enrichedZones,
        message,
      };
    } catch (error) {
      console.error('Error fetching NYC school zones from database:', error);

      if (error instanceof ChatSDKError) {
        throw error;
      }

      return {
        success: false,
        source: 'NYC Department of Education',
        query: searchTerm || dbn || `${borough || 'All'} ${district || ''}`,
        totalResults: 0,
        zones: [],
        error: 'Failed to fetch school zone data from database',
      };
    }
  },
});

// Helper function to convert borough codes to names
function getBoroughName(borough: string): string {
  const boroughMap: Record<string, string> = {
    K: 'Brooklyn',
    M: 'Manhattan',
    Q: 'Queens',
    X: 'Bronx',
    R: 'Staten Island',
  };
  return boroughMap[borough.toUpperCase()] || borough;
}
