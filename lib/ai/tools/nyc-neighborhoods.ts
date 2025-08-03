import { tool } from 'ai';
import { z } from 'zod';

// Cache the processed neighborhood data in memory
let cachedNeighborhoods: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface NeighborhoodData {
  name: string;
  borough: string;
  nta_code: string;
  zipcode?: string;
  zip_city?: string;
  latitude: number;
  longitude: number;
  treeCount: number;
}

async function fetchAndProcessNYCData(): Promise<NeighborhoodData[]> {
  try {
    const baseUrl = 'https://data.cityofnewyork.us/resource/';
    const selectedDataset = 'uvpi-gqnh.json';
    const url = `${baseUrl}${selectedDataset}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`NY Open Data API error: ${response.status}`);
    }

    const data = await response.json();

    // Group by neighborhood and calculate proper centers
    const neighborhoodGroups = data.reduce((acc: any, item: any) => {
      const key = item.nta_name;
      if (!acc[key]) {
        acc[key] = {
          name: item.nta_name,
          borough: item.boroname,
          nta_code: item.nta,
          zipcode: item.zipcode,
          zip_city: item.zip_city,
          trees: [],
          latitude: Number.parseFloat(item.latitude || 0),
          longitude: Number.parseFloat(item.longitude || 0),
        };
      }
      acc[key].trees.push({
        latitude: Number.parseFloat(item.latitude || 0),
        longitude: Number.parseFloat(item.longitude || 0),
      });
      return acc;
    }, {});

    // Calculate proper centers for each neighborhood
    const neighborhoods = Object.values(neighborhoodGroups).map(
      (neighborhood: any) => {
        if (neighborhood.trees.length > 0) {
          const avgLat =
            neighborhood.trees.reduce(
              (sum: number, tree: any) => sum + tree.latitude,
              0,
            ) / neighborhood.trees.length;
          const avgLng =
            neighborhood.trees.reduce(
              (sum: number, tree: any) => sum + tree.longitude,
              0,
            ) / neighborhood.trees.length;
          return {
            ...neighborhood,
            latitude: avgLat,
            longitude: avgLng,
            treeCount: neighborhood.trees.length,
          };
        }
        return {
          ...neighborhood,
          treeCount: 0,
        };
      },
    );

    return neighborhoods;
  } catch (error) {
    console.error('Error fetching NYC neighborhoods data:', error);
    throw error;
  }
}

export const nycNeighborhoods = tool({
  description:
    'Fetch NYC neighborhood data with calculated centers from tree locations. This tool retrieves neighborhood information for New York City by borough or search for specific neighborhoods by name. Data is cached for 24 hours for improved performance.',
  inputSchema: z.object({
    borough: z
      .enum([
        'Manhattan',
        'Brooklyn',
        'Queens',
        'Bronx',
        'Staten Island',
        'All',
      ])
      .optional()
      .default('All')
      .describe('Specific borough to fetch neighborhoods for (default: All)'),
    neighborhood: z
      .string()
      .optional()
      .describe(
        'Search for a specific neighborhood by name (e.g., "Greenpoint", "Williamsburg")',
      ),
    format: z
      .enum(['geojson', 'summary'])
      .optional()
      .default('geojson')
      .describe('Return format - full GeoJSON or summary information'),
    limit: z
      .number()
      .optional()
      .default(50)
      .describe('Maximum number of neighborhoods to return (default: 50)'),
  }),
  execute: async ({
    borough = 'All',
    neighborhood,
    format = 'geojson',
    limit = 50,
  }) => {
    try {
      // Check if cache is valid
      const now = Date.now();
      if (!cachedNeighborhoods || now - lastFetchTime > CACHE_DURATION) {
        console.log('Fetching fresh NYC neighborhoods data...');
        cachedNeighborhoods = await fetchAndProcessNYCData();
        lastFetchTime = now;
      } else {
        console.log('Using cached NYC neighborhoods data');
      }

      // Filter data based on parameters
      let filteredData = cachedNeighborhoods;

      // Filter by borough if specified
      if (borough !== 'All') {
        filteredData = filteredData.filter(
          (item: any) => item.borough?.toLowerCase() === borough.toLowerCase(),
        );
      }

      // Filter by neighborhood if specified
      if (neighborhood) {
        const searchTerm = neighborhood.toLowerCase();
        filteredData = filteredData.filter((item: any) =>
          item.name?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply limit
      const limitedData = filteredData.slice(0, limit);

      if (format === 'summary') {
        const boroughCounts = limitedData.reduce((acc: any, item: any) => {
          acc[item.borough] = (acc[item.borough] || 0) + 1;
          return acc;
        }, {});

        return {
          success: true,
          source: 'NY Open Data (Cached)',
          dataset: 'NYC Trees Dataset (Calculated Centers)',
          borough,
          neighborhood: neighborhood || null,
          totalNeighborhoods: limitedData.length,
          boroughCounts,
          neighborhoods: limitedData.map((item: any) => ({
            name: item.name,
            borough: item.borough,
            nta_code: item.nta_code,
            zipcode: item.zipcode,
            zip_city: item.zip_city,
            latitude: item.latitude,
            longitude: item.longitude,
            treeCount: item.treeCount,
          })),
          dataType: 'Calculated centers from tree locations',
          note: 'This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. Data is cached for 24 hours.',
          cacheInfo: {
            lastUpdated: new Date(lastFetchTime).toISOString(),
            cacheAge: Math.floor((now - lastFetchTime) / 1000 / 60), // minutes
          },
        };
      } else {
        // Return GeoJSON format
        const features = limitedData.map((item: any) => ({
          type: 'Feature',
          properties: {
            name: item.name,
            borough: item.borough,
            nta_code: item.nta_code,
            zipcode: item.zipcode,
            zip_city: item.zip_city,
            latitude: item.latitude,
            longitude: item.longitude,
            treeCount: item.treeCount,
          },
          geometry: {
            type: 'Point',
            coordinates: [item.longitude, item.latitude],
          },
        }));

        const geojson = {
          type: 'FeatureCollection',
          features: features.filter((f: any) => f.geometry !== null),
        };

        return {
          success: true,
          source: 'NY Open Data (Cached)',
          dataset: 'NYC Trees Dataset (Calculated Centers)',
          borough,
          neighborhood: neighborhood || null,
          totalFeatures: geojson.features.length,
          geojson,
          dataType: 'Calculated centers from tree locations',
          note: 'This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. Data is cached for 24 hours.',
          cacheInfo: {
            lastUpdated: new Date(lastFetchTime).toISOString(),
            cacheAge: Math.floor((now - lastFetchTime) / 1000 / 60), // minutes
          },
          summary: {
            neighborhoods: geojson.features.map((f: any) => f.properties.name),
            boroughs: [
              ...new Set(
                geojson.features.map((f: any) => f.properties.borough),
              ),
            ],
          },
        };
      }
    } catch (error) {
      console.error('NYC Neighborhoods error:', error);
      return {
        error: 'Failed to fetch NYC neighborhood data',
        details: error instanceof Error ? error.message : 'Unknown error',
        borough,
        neighborhood: neighborhood || null,
        format,
      };
    }
  },
});
