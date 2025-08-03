import { tool } from 'ai';
import { z } from 'zod';

export const nycNeighborhoods = tool({
  description:
    'Fetch NYC neighborhood data. This tool can retrieve neighborhood information for New York City by borough or search for specific neighborhoods by name.',
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
      // NY Open Data endpoint for NYC neighborhoods
      const baseUrl = 'https://data.cityofnewyork.us/resource/';

      // Use the NYC Trees dataset which contains neighborhood information
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

      // Filter data based on parameters
      let filteredData = data;

      // Filter by borough if specified
      if (borough !== 'All') {
        filteredData = filteredData.filter(
          (item: any) => item.boroname?.toLowerCase() === borough.toLowerCase(),
        );
      }

      // Filter by neighborhood if specified
      if (neighborhood) {
        const searchTerm = neighborhood.toLowerCase();
        filteredData = filteredData.filter((item: any) =>
          item.nta_name?.toLowerCase().includes(searchTerm),
        );
      }

      if (format === 'summary') {
        // Return summary information
        const neighborhoods = filteredData.map((item: any) => ({
          name: item.nta_name || 'Unknown Neighborhood',
          borough: item.boroname || 'Unknown Borough',
          nta_code: item.nta || 'Unknown NTA',
          zipcode: item.zipcode,
          zip_city: item.zip_city,
          latitude: item.latitude,
          longitude: item.longitude,
        }));

        // Remove duplicates based on nta_name
        const uniqueNeighborhoods = neighborhoods.filter(
          (item: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => t.name === item.name),
        );

        const boroughCounts = uniqueNeighborhoods.reduce(
          (acc: any, item: any) => {
            acc[item.borough] = (acc[item.borough] || 0) + 1;
            return acc;
          },
          {},
        );

        return {
          success: true,
          source: 'NY Open Data',
          dataset: 'NYC Trees with Neighborhood Data',
          borough,
          neighborhood: neighborhood || null,
          totalNeighborhoods: uniqueNeighborhoods.length,
          boroughCounts,
          neighborhoods: uniqueNeighborhoods.slice(0, limit),
        };
      } else {
        // Return GeoJSON format
        const features = filteredData.map((item: any) => ({
          type: 'Feature',
          properties: {
            name: item.nta_name || 'Unknown Neighborhood',
            borough: item.boroname || 'Unknown Borough',
            nta_code: item.nta || 'Unknown NTA',
            zipcode: item.zipcode,
            zip_city: item.zip_city,
            latitude: item.latitude,
            longitude: item.longitude,
          },
          geometry: {
            type: 'Point',
            coordinates: [
              Number.parseFloat(item.longitude || 0),
              Number.parseFloat(item.latitude || 0),
            ],
          },
        }));

        // Remove duplicates based on nta_name
        const uniqueFeatures = features.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (t: any) => t.properties.name === item.properties.name,
            ),
        );

        const geojson = {
          type: 'FeatureCollection',
          features: uniqueFeatures.filter((f: any) => f.geometry !== null),
        };

        return {
          success: true,
          source: 'NY Open Data',
          dataset: 'NYC Trees with Neighborhood Data',
          borough,
          neighborhood: neighborhood || null,
          totalFeatures: geojson.features.length,
          geojson,
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
