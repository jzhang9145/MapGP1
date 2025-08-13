import { tool } from 'ai';
import { z } from 'zod';
import {
  getAllNYCParks,
  getNYCParksByBorough,
  searchNYCParks,
  getNYCParkById,
  getNYCParksWithGeoJSON,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { parksResponseSchema, type ParksResponse, formatParkInfo, getBoroughDisplayName } from '@/lib/schemas';

export const nycParks = tool({
  description:
    'Get NYC parks data from the local database. Returns park boundaries, location information, amenities, and details for New York City parks. This tool provides access to official NYC Parks Department data with complete GeoJSON data for mapping park boundaries and locations.',
  inputSchema: z.object({
    searchTerm: z
      .string()
      .optional()
      .describe('Search for park name, sign name, or address'),
    borough: z
      .enum(['Manhattan', 'Bronx', 'Brooklyn', 'Queens', 'Staten Island'])
      .optional()
      .describe('Filter parks by NYC borough'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe('Maximum number of parks to return (1-50, default 10)'),
  }),
  execute: async ({ searchTerm, borough, limit = 10 }) => {
    try {
      console.log('Fetching NYC parks from database...', {
        searchTerm,
        borough,
        limit,
      });

      // Get parks with GeoJSON data
      const parks = await getNYCParksWithGeoJSON({
        searchTerm,
        borough,
        limit,
      });

      console.log(`Found ${parks.length} parks`);

      if (!parks || parks.length === 0) {
        throw new ChatSDKError(
          'bad_request:api',
          'No NYC parks found matching the criteria',
        );
      }

      // Transform the data to match our schema
      const transformedParks = parks.map((park) => ({
        id: park.id,
        gispropnum: park.gispropnum,
        name: park.name,
        signname: park.signname,
        borough: park.borough,
        borocode: park.borocode,
        communityboard: park.communityboard,
        councildistrict: park.councildistrict,
        policepreinct: park.policepreinct,
        assemblydistrict: park.assemblydistrict,
        congressionaldistrict: park.congressionaldistrict,
        senateDistrict: park.senateDistrict,
        zipcode: park.zipcode,
        address: park.address,
        acreage: park.acreage,
        typecategory: park.typecategory,
        landuse: park.landuse,
        department: park.department,
        jurisdiction: park.jurisdiction,
        retired: park.retired,
        waterfront: park.waterfront,
        geojsonDataId: park.geojsonDataId,
        geojson: park.geojson,
        createdAt: park.createdAt?.toISOString(),
        updatedAt: park.updatedAt?.toISOString(),
      }));

      // Generate summary message
      let message = `Found ${parks.length} NYC park${parks.length !== 1 ? 's' : ''}`;
      
      if (searchTerm) {
        message += ` matching "${searchTerm}"`;
      }
      
      if (borough) {
        message += ` in ${getBoroughDisplayName(borough)}`;
      }
      
      message += '. ';
      
      // Add details about parks with boundaries
      const parksWithBoundaries = transformedParks.filter(park => park.geojson);
      if (parksWithBoundaries.length > 0) {
        message += `${parksWithBoundaries.length} park${parksWithBoundaries.length !== 1 ? 's' : ''} ${parksWithBoundaries.length !== 1 ? 'have' : 'has'} boundary data and will be displayed on the map.`;
      }

      // Create the response
      const response: ParksResponse = {
        parks: transformedParks,
        totalCount: parks.length,
        searchTerm,
        borough,
        message,
      };

      return response;
    } catch (error) {
      console.error('Error fetching NYC parks from database:', error);
      
      if (error instanceof ChatSDKError) {
        throw error;
      }
      
      throw new ChatSDKError(
        'bad_request:database',
        'Failed to retrieve NYC parks data',
      );
    }
  },
});