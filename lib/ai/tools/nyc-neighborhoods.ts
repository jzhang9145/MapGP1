import { tool } from 'ai';
import { z } from 'zod';
import { createGeoJSONData } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { neighborhoodDataSchema, type NeighborhoodData } from '@/lib/schemas';

// Cache the processed neighborhood data in memory
let cachedNeighborhoods: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Store geometry data in GeoJSONData table and return the ID
async function storeGeometryData(geojson: any, metadata: any) {
  try {
    console.log('Storing geometry data:', {
      geojson: typeof geojson,
      metadata,
    });

    // Validate geojson data
    if (!geojson || typeof geojson !== 'object') {
      throw new Error('Invalid GeoJSON data provided');
    }

    const geojsonData = await createGeoJSONData({
      data: geojson,
      metadata: {
        type: 'nyc_neighborhoods',
        source: 'NY Open Data',
        dataset: 'NYC Neighborhood Tabulation Areas 2020',
        ...metadata,
      },
    });

    console.log(
      'Successfully stored geometry data with ID:',
      geojsonData[0]?.id,
    );
    return geojsonData[0].id;
  } catch (error) {
    console.error('Failed to store geometry data:', error);
    throw new ChatSDKError(
      'bad_request:api',
      `Failed to store geometry data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Fetch and process NYC neighborhood data
async function fetchAndProcessNYCData() {
  const now = Date.now();

  // Return cached data if still valid
  if (
    cachedNeighborhoods &&
    lastFetchTime > 0 &&
    now - lastFetchTime < CACHE_DURATION
  ) {
    return cachedNeighborhoods;
  }

  try {
    // Fetch data from NYC Open Data API
    console.log('Fetching NYC neighborhood data...');
    const response = await fetch(
      'https://data.cityofnewyork.us/resource/9nt8-h7nd.json',
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data from NYC API:', {
      count: data.length,
      sampleItem: data[0] ? Object.keys(data[0]) : 'No data',
    });

    // Validate that we received an array
    if (!Array.isArray(data)) {
      throw new Error('NYC API returned non-array data');
    }

    if (data.length === 0) {
      throw new Error('NYC API returned empty data');
    }

    // Process and store geometry data
    const processedData = await Promise.all(
      data.map(async (item: any) => {
        try {
          console.log('Processing item:', {
            name: item.ntaname,
            hasGeometry: !!item.the_geom,
            geometryType: typeof item.the_geom,
          });

          // Store the geometry data and get the ID
          let geojsonDataId: string | undefined;
          if (item.the_geom) {
            try {
              geojsonDataId = await storeGeometryData(item.the_geom, {
                neighborhood: item.ntaname,
                borough: item.boroname,
                nta_code: item.nta2020,
              });
            } catch (error) {
              console.warn('Failed to store geometry for', item.ntaname, error);
              // Continue without geometry if storage fails
            }
          }

          return {
            name: item.ntaname,
            borough: item.boroname,
            nta_code: item.nta2020,
            nta_name: item.ntaname,
            nta_2020: item.nta2020,
            cdtca: item.cdta2020,
            cdtca_name: item.cdtaname,
            center: {
              latitude: 0, // Calculate from geometry if needed
              longitude: 0, // Calculate from geometry if needed
            },
            geojsonDataId, // Store the reference ID instead of geometry
            shape_area: item.shape_area,
            shape_leng: item.shape_leng,
          };
        } catch (error) {
          console.error('Error processing item:', item.ntaname, error);
          // Return a basic item without geometry if processing fails
          return {
            name: item.ntaname || 'Unknown',
            borough: item.boroname || 'Unknown',
            nta_code: item.nta2020 || 'Unknown',
            nta_name: item.ntaname || 'Unknown',
            nta_2020: item.nta2020 || 'Unknown',
            cdtca: item.cdta2020 || 'Unknown',
            cdtca_name: item.cdtaname || 'Unknown',
            center: {
              latitude: 0,
              longitude: 0,
            },
            geojsonDataId: undefined,
            shape_area: item.shape_area,
            shape_leng: item.shape_leng,
          };
        }
      }),
    );

    // Update cache
    cachedNeighborhoods = processedData;
    lastFetchTime = now;

    return processedData;
  } catch (error) {
    console.error('Error fetching NYC data:', error);
    throw new ChatSDKError(
      'bad_request:api',
      'Failed to fetch NYC neighborhood data',
    );
  }
}

export const nycNeighborhoods = tool({
  description:
    'Get NYC neighborhood data from official NYC Neighborhood Tabulation Areas. Returns geographic boundaries, demographics, and neighborhood information for New York City areas. Geometry data is stored separately and referenced by ID to optimize performance.',
  inputSchema: z.object({
    neighborhood: z
      .string()
      .optional()
      .describe('Specific neighborhood name to search for'),
  }),
  outputSchema: neighborhoodDataSchema,
  execute: async ({ neighborhood }): Promise<NeighborhoodData> => {
    const now = Date.now();

    // Fetch or get cached data
    const neighborhoods = await fetchAndProcessNYCData();

    if (!cachedNeighborhoods || cachedNeighborhoods.length === 0) {
      throw new ChatSDKError(
        'bad_request:api',
        'NYC neighborhoods data not found',
      );
    }

    // Filter data based on parameters
    let filteredData = cachedNeighborhoods;

    if (neighborhood) {
      filteredData = filteredData.filter((item: any) =>
        item.name.toLowerCase().includes(neighborhood.toLowerCase()),
      );
    }

    if (filteredData.length === 1) {
      return filteredData[0];
    }

    console.log('Filtered data count:', filteredData.length);

    // Return GeoJSON format - we need to reconstruct the geojson from stored data
    // For now, return a simplified version with center points
    // In a full implementation, you would fetch the geometry data from GeoJSONData table
    const features = filteredData.map((item: any) => ({
      type: 'Feature' as const,
      properties: {
        name: item.name,
        borough: item.borough,
        nta_code: item.nta_code,
        nta_2020: item.nta_2020,
        cdtca: item.cdtca,
        cdtca_name: item.cdtca_name,
        center_lat: item.center.latitude,
        center_lng: item.center.longitude,
        geojsonDataId: item.geojsonDataId,
        shape_area: item.shape_area,
        shape_leng: item.shape_leng,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [item.center.longitude, item.center.latitude] as [
          number,
          number,
        ],
      },
    }));

    const geojson = {
      type: 'FeatureCollection' as const,
      features: features,
    };

    try {
      const geojsonDataId = await storeGeometryData(geojson, {
        neighborhood: neighborhood || null,
      });

      return {
        name: neighborhood || 'All',
        geojsonDataId,
      };
    } catch (error) {
      console.warn(
        'Failed to store geometry data, returning basic response:',
        error,
      );

      // Return a basic response without geometry storage
      return {
        name: neighborhood || 'All',
        geojsonDataId: undefined,
        borough: filteredData[0]?.borough,
        nta_code: filteredData[0]?.nta_code,
        center: filteredData[0]?.center,
      };
    }
  },
});
