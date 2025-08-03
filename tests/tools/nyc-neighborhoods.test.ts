import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { nycNeighborhoods } from '@/lib/ai/tools/nyc-neighborhoods';

describe('nycNeighborhoods Tool', () => {
  // Test timeout for network requests
  const TIMEOUT = 30000;

  describe('Basic Functionality', () => {
    it(
      'should fetch all NYC neighborhoods with default parameters',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'geojson',
          limit: 50,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('source', 'NY Open Data');
        expect(result).toHaveProperty('dataset', 'Community Districts');
        expect(result).toHaveProperty('borough', 'All');
        expect(result).toHaveProperty('totalFeatures');
        expect(result).toHaveProperty('geojson');
        expect(result).toHaveProperty('summary');

        // Verify GeoJSON structure
        const geojson = (result as any).geojson;
        expect(geojson).toHaveProperty('type', 'FeatureCollection');
        expect(geojson).toHaveProperty('features');
        expect(Array.isArray(geojson.features)).toBe(true);
        expect(geojson.features.length).toBeGreaterThan(0);

        // Verify summary structure
        const summary = (result as any).summary;
        expect(summary).toHaveProperty('neighborhoods');
        expect(summary).toHaveProperty('boroughs');
        expect(Array.isArray(summary.neighborhoods)).toBe(true);
        expect(Array.isArray(summary.boroughs)).toBe(true);
      },
      TIMEOUT,
    );

    it(
      'should fetch summary format correctly',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'summary',
          limit: 10,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('format', 'summary');
        expect(result).toHaveProperty('totalNeighborhoods');
        expect(result).toHaveProperty('boroughCounts');
        expect(result).toHaveProperty('neighborhoods');

        // Verify summary data structure
        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);
        expect(neighborhoods.length).toBeLessThanOrEqual(10);

        if (neighborhoods.length > 0) {
          const firstNeighborhood = neighborhoods[0];
          expect(firstNeighborhood).toHaveProperty('name');
          expect(firstNeighborhood).toHaveProperty('borough');
          expect(firstNeighborhood).toHaveProperty('cd');
        }
      },
      TIMEOUT,
    );
  });

  describe('Borough Filtering', () => {
    it(
      'should filter Manhattan neighborhoods correctly',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'Manhattan',
          format: 'summary',
          limit: 20,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('borough', 'Manhattan');

        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);

        // All neighborhoods should be from Manhattan
        neighborhoods.forEach((neighborhood: any) => {
          expect(neighborhood.borough).toBe('Manhattan');
        });

        // Manhattan should have around 12 community districts
        expect(neighborhoods.length).toBeLessThanOrEqual(12);
      },
      TIMEOUT,
    );

    it(
      'should filter Brooklyn neighborhoods correctly',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'Brooklyn',
          format: 'summary',
          limit: 20,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('borough', 'Brooklyn');

        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);

        // All neighborhoods should be from Brooklyn
        neighborhoods.forEach((neighborhood: any) => {
          expect(neighborhood.borough).toBe('Brooklyn');
        });

        // Brooklyn should have around 18 community districts
        expect(neighborhoods.length).toBeLessThanOrEqual(18);
      },
      TIMEOUT,
    );

    it(
      'should filter Queens neighborhoods correctly',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'Queens',
          format: 'summary',
          limit: 20,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('borough', 'Queens');

        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);

        // All neighborhoods should be from Queens
        neighborhoods.forEach((neighborhood: any) => {
          expect(neighborhood.borough).toBe('Queens');
        });

        // Queens should have around 14 community districts
        expect(neighborhoods.length).toBeLessThanOrEqual(14);
      },
      TIMEOUT,
    );
  });

  describe('Limit Functionality', () => {
    it(
      'should respect the limit parameter',
      async () => {
        const limit = 5;
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'summary',
          limit,
        });

        expect(result).toHaveProperty('success', true);
        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);
        expect(neighborhoods.length).toBeLessThanOrEqual(limit);
      },
      TIMEOUT,
    );

    it(
      'should handle large limits',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'summary',
          limit: 100,
        });

        expect(result).toHaveProperty('success', true);
        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);
        // Should return all available neighborhoods (around 59)
        expect(neighborhoods.length).toBeGreaterThan(50);
      },
      TIMEOUT,
    );
  });

  describe('GeoJSON Format', () => {
    it(
      'should return valid GeoJSON structure',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'Manhattan',
          format: 'geojson',
          limit: 5,
        });

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('geojson');

        const geojson = (result as any).geojson;
        expect(geojson).toHaveProperty('type', 'FeatureCollection');
        expect(geojson).toHaveProperty('features');
        expect(Array.isArray(geojson.features)).toBe(true);

        // Check first feature structure
        if (geojson.features.length > 0) {
          const feature = geojson.features[0];
          expect(feature).toHaveProperty('type', 'Feature');
          expect(feature).toHaveProperty('properties');
          expect(feature).toHaveProperty('geometry');

          const properties = feature.properties;
          expect(properties).toHaveProperty('name');
          expect(properties).toHaveProperty('borough');
          expect(properties).toHaveProperty('cd');
          expect(properties.borough).toBe('Manhattan');
        }
      },
      TIMEOUT,
    );

    it(
      'should handle features without geometry gracefully',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'geojson',
          limit: 10,
        });

        expect(result).toHaveProperty('success', true);
        const geojson = (result as any).geojson;
        expect(geojson).toHaveProperty('features');
        expect(Array.isArray(geojson.features)).toBe(true);

        // All features should have valid geometry or be filtered out
        geojson.features.forEach((feature: any) => {
          expect(feature.geometry).not.toBeNull();
        });
      },
      TIMEOUT,
    );
  });

  describe('Error Handling', () => {
    it(
      'should handle network errors gracefully',
      async () => {
        // This test would require mocking the fetch to simulate network errors
        // For now, we'll test that the tool doesn't crash with invalid parameters
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'geojson',
          limit: -1, // Invalid limit
        });

        // Should still return a result (API might handle invalid limits)
        expect(result).toBeDefined();
      },
      TIMEOUT,
    );
  });

  describe('Data Quality', () => {
    it(
      'should return consistent borough names',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'All',
          format: 'summary',
          limit: 20,
        });

        expect(result).toHaveProperty('success', true);
        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);

        // Check that borough names are consistent
        const boroughNames = [
          ...new Set(neighborhoods.map((n: any) => n.borough)),
        ];
        const validBoroughs = [
          'Manhattan',
          'Brooklyn',
          'Queens',
          'Bronx',
          'Staten Island',
        ];

        boroughNames.forEach((borough: string) => {
          expect(validBoroughs).toContain(borough);
        });
      },
      TIMEOUT,
    );

    it(
      'should have valid neighborhood names',
      async () => {
        const result = await nycNeighborhoods.execute({
          borough: 'Manhattan',
          format: 'summary',
          limit: 10,
        });

        expect(result).toHaveProperty('success', true);
        const neighborhoods = (result as any).neighborhoods;
        expect(Array.isArray(neighborhoods)).toBe(true);

        neighborhoods.forEach((neighborhood: any) => {
          expect(neighborhood.name).toBeDefined();
          expect(typeof neighborhood.name).toBe('string');
          expect(neighborhood.name.length).toBeGreaterThan(0);
          expect(neighborhood.cd).toBeDefined();
          expect(typeof neighborhood.cd).toBe('string');
        });
      },
      TIMEOUT,
    );
  });

  describe('Performance', () => {
    it(
      'should complete within reasonable time',
      async () => {
        const startTime = Date.now();

        await nycNeighborhoods.execute({
          borough: 'All',
          format: 'summary',
          limit: 10,
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
      },
      TIMEOUT,
    );
  });
});
