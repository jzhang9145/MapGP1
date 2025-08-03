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
  nta_name: string;
  nta_2020: string;
  cdtca: string;
  cdtca_name: string;
  geometry: any; // GeoJSON polygon geometry
  center: {
    latitude: number;
    longitude: number;
  };
  shape_area?: string;
  shape_leng?: string;
}

async function fetchAndProcessNYCData(): Promise<NeighborhoodData[]> {
  try {
    const baseUrl = 'https://data.cityofnewyork.us/resource/';
    // Use the official NYC Neighborhood Tabulation Areas 2020 dataset
    const selectedDataset = '9nt8-h7nd.json';
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

    // Process the official NTA data with polygon geometries
    const neighborhoods = data.map((item: any) => {
      // Parse the geometry if it's a string
      let geometry = null;
      if (item.the_geom) {
        try {
          geometry =
            typeof item.the_geom === 'string'
              ? JSON.parse(item.the_geom)
              : item.the_geom;
        } catch (e) {
          console.warn('Failed to parse geometry for', item.ntaname);
        }
      }

      // Calculate center from polygon if geometry is available
      let center = { latitude: 0, longitude: 0 };
      if (geometry?.coordinates?.[0]?.[0]) {
        const coords = geometry.coordinates[0][0]; // First ring of first polygon
        const avgLat =
          coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) /
          coords.length;
        const avgLng =
          coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) /
          coords.length;
        center = { latitude: avgLat, longitude: avgLng };
      }

      return {
        name: item.ntaname,
        borough: item.boroname,
        nta_code: item.nta2020,
        nta_name: item.ntaname,
        nta_2020: item.nta2020,
        cdtca: item.cdta2020,
        cdtca_name: item.cdtaname,
        geometry: geometry,
        center: center,
        shape_area: item.shape_area,
        shape_leng: item.shape_leng,
      };
    });

    return neighborhoods;
  } catch (error) {
    console.error('Error fetching NYC neighborhoods data:', error);
    throw error;
  }
}

export const nycNeighborhoods = tool({
  description:
    'Fetch NYC neighborhood data with official polygon boundaries from the NYC Neighborhood Tabulation Areas 2020 dataset. This tool retrieves neighborhood information for New York City by borough or search for specific neighborhoods by name. Data includes complete polygon geometries for accurate mapping and area calculations. Data is cached for 24 hours for improved performance.',
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
          dataset: 'NYC Neighborhood Tabulation Areas 2020',
          borough,
          neighborhood: neighborhood || null,
          totalNeighborhoods: limitedData.length,
          boroughCounts,
          neighborhoods: limitedData.map((item: any) => ({
            name: item.name,
            borough: item.borough,
            nta_code: item.nta_code,
            nta_2020: item.nta_2020,
            cdtca: item.cdtca,
            cdtca_name: item.cdtca_name,
            center: item.center,
            hasPolygon: !!item.geometry,
            shape_area: item.shape_area,
            shape_leng: item.shape_leng,
          })),
          dataType:
            'Official polygon boundaries from NYC Neighborhood Tabulation Areas',
          note: 'This dataset contains official NYC Neighborhood Tabulation Areas with complete polygon boundaries for accurate mapping and area calculations.',
          cacheInfo: {
            lastUpdated: new Date(lastFetchTime).toISOString(),
            cacheAge: Math.floor((now - lastFetchTime) / 1000 / 60), // minutes
          },
        };
      } else {
        // Return GeoJSON format with polygon geometries
        const features = limitedData.map((item: any) => ({
          type: 'Feature',
          properties: {
            name: item.name,
            borough: item.borough,
            nta_code: item.nta_code,
            nta_2020: item.nta_2020,
            cdtca: item.cdtca,
            cdtca_name: item.cdtca_name,
            center_lat: item.center.latitude,
            center_lng: item.center.longitude,
            shape_area: item.shape_area,
            shape_leng: item.shape_leng,
          },
          geometry: item.geometry || {
            type: 'Point',
            coordinates: [item.center.longitude, item.center.latitude],
          },
        }));

        const geojson = {
          type: 'FeatureCollection',
          features: features.filter((f: any) => f.geometry !== null),
        };

        return {
          success: true,
          source: 'NY Open Data (Cached)',
          dataset: 'NYC Neighborhood Tabulation Areas 2020',
          borough,
          neighborhood: neighborhood || null,
          totalFeatures: geojson.features.length,
          geojson,
          dataType:
            'Official polygon boundaries from NYC Neighborhood Tabulation Areas',
          note: 'This dataset contains official NYC Neighborhood Tabulation Areas with complete polygon boundaries for accurate mapping and area calculations.',
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
