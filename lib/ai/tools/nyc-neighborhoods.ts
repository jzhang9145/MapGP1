import { tool } from 'ai';
import { z } from 'zod';

export const nycNeighborhoods = tool({
  description:
    'Fetch NYC neighborhood data with calculated centers from tree locations. This tool retrieves neighborhood information for New York City by borough or search for specific neighborhoods by name. Note: Currently uses tree location data to calculate neighborhood centers as polygon boundaries are not available in the current dataset.',
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
      // Note: This dataset contains individual tree locations, not polygon boundaries
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

      // Group by neighborhood and calculate proper centers
      const neighborhoodGroups = filteredData.reduce((acc: any, item: any) => {
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
          return neighborhood;
        },
      );

      if (format === 'summary') {
        // Return summary information
        const summaryNeighborhoods = neighborhoods.map((item: any) => ({
          name: item.name || 'Unknown Neighborhood',
          borough: item.borough || 'Unknown Borough',
          nta_code: item.nta_code || 'Unknown NTA',
          zipcode: item.zipcode,
          zip_city: item.zip_city,
          latitude: item.latitude,
          longitude: item.longitude,
          treeCount: item.treeCount || 0,
        }));

        const boroughCounts = summaryNeighborhoods.reduce(
          (acc: any, item: any) => {
            acc[item.borough] = (acc[item.borough] || 0) + 1;
            return acc;
          },
          {},
        );

        return {
          success: true,
          source: 'NY Open Data',
          dataset: 'NYC Trees Dataset (Calculated Centers)',
          borough,
          neighborhood: neighborhood || null,
          totalNeighborhoods: summaryNeighborhoods.length,
          boroughCounts,
          neighborhoods: summaryNeighborhoods.slice(0, limit),
          dataType: 'Calculated centers from tree locations',
          note: 'This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. For full polygon boundaries, a different dataset would be needed.',
        };
      } else {
        // Return GeoJSON format
        const features = neighborhoods.map((item: any) => ({
          type: 'Feature',
          properties: {
            name: item.name || 'Unknown Neighborhood',
            borough: item.borough || 'Unknown Borough',
            nta_code: item.nta_code || 'Unknown NTA',
            zipcode: item.zipcode,
            zip_city: item.zip_city,
            latitude: item.latitude,
            longitude: item.longitude,
            treeCount: item.treeCount || 0,
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
          source: 'NY Open Data',
          dataset: 'NYC Trees Dataset (Calculated Centers)',
          borough,
          neighborhood: neighborhood || null,
          totalFeatures: geojson.features.length,
          geojson,
          dataType: 'Calculated centers from tree locations',
          note: 'This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. For full polygon boundaries, a different dataset would be needed.',
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
