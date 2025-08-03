import { describe, it, expect } from 'vitest';
import {
  nycNeighborhoodsErrorSchema,
  nycNeighborhoodsSummarySchema,
  nycNeighborhoodsReferenceSchema,
  nycNeighborhoodsGeoJSONSchema,
  nycNeighborhoodsResponseSchema,
} from '@/lib/schemas';

describe('NYC Neighborhoods Schema Tests', () => {
  it('should validate error response schema', () => {
    const errorResponse = {
      error: 'Failed to fetch data',
      details: 'Network timeout',
      borough: 'Manhattan',
      neighborhood: null,
      format: 'geojson',
    };

    const result = nycNeighborhoodsErrorSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
  });

  it('should validate summary response schema', () => {
    const summaryResponse = {
      success: true,
      source: 'NY Open Data (Cached)',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      borough: 'Manhattan',
      neighborhood: null,
      totalNeighborhoods: 1,
      boroughCounts: { Manhattan: 1 },
      neighborhoods: [
        {
          name: 'Test Neighborhood',
          borough: 'Manhattan',
          nta_code: 'TEST',
          nta_2020: 'TEST',
          cdtca: 'TEST',
          cdtca_name: 'Test CDTCA',
          center: { latitude: 40.7128, longitude: -74.006 },
          hasGeometry: true,
          geojsonDataId: 'test-id',
        },
      ],
      dataType: 'Official polygon boundaries',
      note: 'Test note',
      cacheInfo: {
        lastUpdated: '2024-01-01T00:00:00Z',
        cacheAge: 0,
      },
    };

    const result = nycNeighborhoodsSummarySchema.safeParse(summaryResponse);
    expect(result.success).toBe(true);
  });

  it('should validate reference response schema', () => {
    const referenceResponse = {
      success: true,
      source: 'NY Open Data (Cached)',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      borough: 'Manhattan',
      neighborhood: null,
      totalFeatures: 1,
      dataType: 'Reference Collection',
      note: 'Reference format - geometry data stored separately',
      cacheInfo: {
        lastUpdated: '2024-01-01T00:00:00Z',
        cacheAge: 0,
      },
      summary: {
        neighborhoods: ['Test Neighborhood'],
        boroughs: ['Manhattan'],
      },
      references: [
        {
          name: 'Test Neighborhood',
          borough: 'Manhattan',
          nta_code: 'TEST',
          center: { latitude: 40.7128, longitude: -74.006 },
          geojsonDataId: 'test-id',
          hasGeometry: true,
        },
      ],
    };

    const result = nycNeighborhoodsReferenceSchema.safeParse(referenceResponse);
    expect(result.success).toBe(true);
  });

  it('should validate GeoJSON response schema', () => {
    const geojsonResponse = {
      success: true,
      source: 'NY Open Data (Cached)',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      borough: 'Manhattan',
      neighborhood: null,
      totalFeatures: 1,
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Test Neighborhood',
              borough: 'Manhattan',
              nta_code: 'TEST',
              nta_2020: 'TEST',
              cdtca: 'TEST',
              cdtca_name: 'Test CDTCA',
              center_lat: 40.7128,
              center_lng: -74.006,
              geojsonDataId: 'test-id',
            },
            geometry: {
              type: 'Point',
              coordinates: [-74.006, 40.7128],
            },
          },
        ],
      },
      dataType: 'Official polygon boundaries (simplified to points)',
      note: 'Geometry data is stored separately and referenced by geojsonDataId',
      cacheInfo: {
        lastUpdated: '2024-01-01T00:00:00Z',
        cacheAge: 0,
      },
      summary: {
        neighborhoods: ['Test Neighborhood'],
        boroughs: ['Manhattan'],
      },
    };

    const result = nycNeighborhoodsGeoJSONSchema.safeParse(geojsonResponse);
    expect(result.success).toBe(true);
  });

  it('should validate union response schema with error', () => {
    const errorResponse = {
      error: 'Failed to fetch data',
      details: 'Network timeout',
    };

    const result = nycNeighborhoodsResponseSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
  });

  it('should validate union response schema with summary', () => {
    const summaryResponse = {
      success: true,
      source: 'NY Open Data (Cached)',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      borough: 'Manhattan',
      neighborhood: null,
      totalNeighborhoods: 1,
      boroughCounts: { Manhattan: 1 },
      neighborhoods: [
        {
          name: 'Test Neighborhood',
          borough: 'Manhattan',
          nta_code: 'TEST',
          nta_2020: 'TEST',
          cdtca: 'TEST',
          cdtca_name: 'Test CDTCA',
          center: { latitude: 40.7128, longitude: -74.006 },
          hasGeometry: true,
          geojsonDataId: 'test-id',
        },
      ],
      dataType: 'Official polygon boundaries',
      note: 'Test note',
      cacheInfo: {
        lastUpdated: '2024-01-01T00:00:00Z',
        cacheAge: 0,
      },
    };

    const result = nycNeighborhoodsResponseSchema.safeParse(summaryResponse);
    expect(result.success).toBe(true);
  });

  it('should reject invalid error response', () => {
    const invalidErrorResponse = {
      // Missing required 'error' field
      details: 'Network timeout',
    };

    const result = nycNeighborhoodsErrorSchema.safeParse(invalidErrorResponse);
    expect(result.success).toBe(false);
  });

  it('should reject invalid summary response', () => {
    const invalidSummaryResponse = {
      success: false, // Should be true
      source: 'NY Open Data (Cached)',
      // Missing required fields
    };

    const result = nycNeighborhoodsSummarySchema.safeParse(invalidSummaryResponse);
    expect(result.success).toBe(false);
  });

  it('should reject invalid GeoJSON response', () => {
    const invalidGeojsonResponse = {
      success: true,
      source: 'NY Open Data (Cached)',
      dataset: 'NYC Neighborhood Tabulation Areas 2020',
      borough: 'Manhattan',
      neighborhood: null,
      totalFeatures: 1,
      geojson: {
        type: 'InvalidType', // Should be 'FeatureCollection'
        features: [],
      },
      dataType: 'Test type',
      note: 'Test note',
      cacheInfo: {
        lastUpdated: '2024-01-01T00:00:00Z',
        cacheAge: 0,
      },
      summary: {
        neighborhoods: [],
        boroughs: [],
      },
    };

    const result = nycNeighborhoodsGeoJSONSchema.safeParse(invalidGeojsonResponse);
    expect(result.success).toBe(false);
  });
}); 