import { tool } from 'ai';
import { z } from 'zod';
import {
  getAllNYCNeighborhoods,
  getNYCNeighborhoodsByBorough,
  searchNYCNeighborhoods,
  createGeoJSONData,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { neighborhoodDataSchema, type NeighborhoodData } from '@/lib/schemas';

export const nycNeighborhoods = tool({
  description:
    'Get NYC neighborhood data from the local database. Returns geographic boundaries, demographics, and neighborhood information for New York City areas. Data is stored locally for optimal performance.',
  inputSchema: z.object({
    borough: z
      .string()
      .optional()
      .describe(
        'Specific borough to filter by (Manhattan, Brooklyn, Queens, Bronx, Staten Island)',
      ),
    neighborhood: z
      .string()
      .optional()
      .describe('Specific neighborhood name to search for'),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of neighborhoods to return (default: 50)'),
  }),
  outputSchema: neighborhoodDataSchema,
  execute: async ({
    borough,
    neighborhood,
    limit = 50,
  }): Promise<NeighborhoodData> => {
    try {
      let neighborhoods: any[];

      // Query based on parameters
      if (neighborhood) {
        // Search by neighborhood name
        neighborhoods = await searchNYCNeighborhoods({
          searchTerm: neighborhood,
        });
      } else if (borough && borough !== 'All') {
        // Filter by borough
        neighborhoods = await getNYCNeighborhoodsByBorough({ borough });
      } else {
        // Get all neighborhoods
        neighborhoods = await getAllNYCNeighborhoods();
      }

      if (!neighborhoods || neighborhoods.length === 0) {
        throw new ChatSDKError(
          'bad_request:api',
          'No NYC neighborhoods found matching the criteria',
        );
      }

      // Apply limit
      const limitedNeighborhoods = neighborhoods.slice(0, limit);

      // If only one result, return it directly
      if (limitedNeighborhoods.length === 1) {
        const item = limitedNeighborhoods[0];
        return {
          name: item.name,
          borough: item.borough,
          nta_code: item.nta_code,
          nta_name: item.nta_name,
          nta_2020: item.nta_2020,
          cdtca: item.cdtca,
          cdtca_name: item.cdtca_name,
          center: {
            latitude: Number(item.center_latitude),
            longitude: Number(item.center_longitude),
          },
          geojsonDataId: item.geojsonDataId || undefined,
          shape_area: item.shape_area || undefined,
          shape_leng: item.shape_leng || undefined,
        };
      }

      // Create GeoJSON feature collection for multiple results
      const features = limitedNeighborhoods.map((item) => ({
        type: 'Feature' as const,
        properties: {
          name: item.name,
          borough: item.borough,
          nta_code: item.nta_code,
          nta_2020: item.nta_2020,
          cdtca: item.cdtca,
          cdtca_name: item.cdtca_name,
          center_lat: Number(item.center_latitude),
          center_lng: Number(item.center_longitude),
          geojsonDataId: item.geojsonDataId,
          shape_area: item.shape_area,
          shape_leng: item.shape_leng,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [
            Number(item.center_longitude),
            Number(item.center_latitude),
          ] as [number, number],
        },
      }));

      const geojson = {
        type: 'FeatureCollection' as const,
        features: features,
      };

      // Store the GeoJSON data and get the ID
      const geojsonData = await createGeoJSONData({
        data: geojson,
        metadata: {
          type: 'nyc_neighborhoods',
          source: 'Local Database',
          dataset: 'NYC Neighborhood Tabulation Areas 2020',
          borough: borough || null,
          neighborhood: neighborhood || null,
          count: limitedNeighborhoods.length,
        },
      });

      return {
        name: neighborhood || borough || 'All NYC Neighborhoods',
        geojsonDataId: geojsonData[0]?.id || '',
        borough: limitedNeighborhoods[0]?.borough,
        nta_code: limitedNeighborhoods[0]?.nta_code,
        center: {
          latitude: Number(limitedNeighborhoods[0]?.center_latitude),
          longitude: Number(limitedNeighborhoods[0]?.center_longitude),
        },
      };
    } catch (error) {
      console.error('Error fetching NYC neighborhoods from database:', error);
      throw new ChatSDKError(
        'bad_request:api',
        'Failed to fetch NYC neighborhood data from database',
      );
    }
  },
});
