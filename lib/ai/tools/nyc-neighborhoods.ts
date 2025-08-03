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
  const geojsonData = await createGeoJSONData({
    data: geojson,
    metadata: {
      type: 'nyc_neighborhoods',
      source: 'NY Open Data',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      ...metadata,
    },
  });
  return geojsonData[0].id;
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
    const response = await fetch(
      'https://data.cityofnewyork.us/resource/5uac-w243.json',
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Process and store geometry data
    const processedData = await Promise.all(
      data.map(async (item: any) => {
        // Store the geometry data and get the ID
        const geojsonDataId = await storeGeometryData(item.the_geom, {
          neighborhood: item.nta_name,
          borough: item.boro_name,
          nta_code: item.nta_code,
        });

        return {
          name: item.nta_name,
          borough: item.boro_name,
          nta_code: item.nta_code,
          nta_name: item.nta_name,
          nta_2020: item.nta2020,
          cdtca: item.cdtca,
          cdtca_name: item.cdtca_name,
          center: {
            latitude: Number.parseFloat(item.latitude),
            longitude: Number.parseFloat(item.longitude),
          },
          geojsonDataId, // Store the reference ID instead of geometry
          shape_area: item.shape_area,
          shape_leng: item.shape_leng,
        };
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

    console.log(filteredData);

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

    const geojsonDataId = await storeGeometryData(geojson, {
      neighborhood: neighborhood || null,
    });

    return {
      name: neighborhood || 'All',
      geojsonDataId,
    };
  },
});
