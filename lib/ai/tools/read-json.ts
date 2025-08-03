import { tool } from 'ai';
import { z } from 'zod';

export const readJSON = tool({
  description:
    'Read and parse JSON files from web URLs. This tool can handle various JSON formats including GeoJSON files and provides structured data extraction.',
  inputSchema: z.object({
    url: z.string().describe('The URL of the JSON file to read'),
    extractFields: z
      .array(z.string())
      .optional()
      .describe('Specific fields to extract from the JSON (optional)'),
  }),
  execute: async ({ url, extractFields }) => {
    try {
      // Fetch the JSON file
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // Check if it's actually JSON
      if (
        !contentType.includes('application/json') &&
        !contentType.includes('text/json') &&
        !(url.endsWith('.json') || url.endsWith('.geojson'))
      ) {
        return {
          error: `URL does not appear to be a JSON file: ${url}`,
          url,
          contentType,
        };
      }

      const content = await response.text();

      // Parse the JSON
      const jsonData = JSON.parse(content);

      // Extract basic information
      const result: any = {
        success: true,
        url,
        contentType,
        contentLength: content.length,
        dataType: typeof jsonData,
        isArray: Array.isArray(jsonData),
      };

      // Handle GeoJSON specifically
      if (jsonData.type === 'FeatureCollection') {
        result.geojsonType = 'FeatureCollection';
        result.featureCount = jsonData.features?.length || 0;

        if (jsonData.features && jsonData.features.length > 0) {
          // Extract feature names
          const featureNames = jsonData.features
            .map((feature: any) => feature.properties?.name)
            .filter(Boolean)
            .slice(0, 10);
          result.featureNames = featureNames;

          // Extract first few features for preview
          result.previewFeatures = jsonData.features
            .slice(0, 3)
            .map((feature: any) => ({
              type: feature.type,
              properties: feature.properties,
              geometry: feature.geometry?.type,
            }));
        }
      } else if (jsonData.type === 'Feature') {
        result.geojsonType = 'Feature';
        result.featureName = jsonData.properties?.name;
        result.geometryType = jsonData.geometry?.type;
      }

      // Extract specific fields if requested
      if (extractFields && extractFields.length > 0) {
        result.extractedFields = {};
        for (const field of extractFields) {
          if (Object.prototype.hasOwnProperty.call(jsonData, field)) {
            result.extractedFields[field] = jsonData[field];
          }
        }
      }

      // Add a preview of the data structure
      if (Array.isArray(jsonData)) {
        result.arrayLength = jsonData.length;
        result.preview = jsonData.slice(0, 3);
      } else if (typeof jsonData === 'object') {
        result.keys = Object.keys(jsonData);
        result.preview = Object.fromEntries(
          Object.entries(jsonData).slice(0, 5),
        );
      }

      return result;
    } catch (error) {
      console.error('JSON reading error:', error);
      return {
        error: 'Failed to read JSON file',
        url,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
