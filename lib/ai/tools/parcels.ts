import { tool } from 'ai';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';
import {
  createGeoJSONData,
  getGeoJSONDataById,
  searchNYCNeighborhoods,
} from '@/lib/db/queries';
import {
  plutoSearchResponseSchema,
  type PlutoSearchResponse,
} from '@/lib/schemas';

export const parcels = tool({
  description:
    "Unified parcels tool: combine geometry (neighborhood/polygon) and attribute filters to query NYC Planning's MapPLUTO (live ArcGIS). Auto-paginates and returns a reference for map rendering.",
  inputSchema: z.object({
    neighborhood: z
      .string()
      .optional()
      .describe('Neighborhood name (e.g., "Chinatown")'),
    geojsonDataId: z
      .string()
      .optional()
      .describe('Existing GeoJSON data ID to use as geometry'),
    geometry: z
      .object({
        type: z.enum(['Polygon', 'MultiPolygon']),
        coordinates: z.any(),
      })
      .optional()
      .describe('Raw GeoJSON geometry'),
    borough: z.string().optional(),
    zoningDistrict: z.string().optional(),
    landUse: z.string().optional(),
    buildingClass: z.string().optional(),
    yearBuiltMin: z.number().optional(),
    yearBuiltMax: z.number().optional(),
    lotAreaMin: z.number().optional(),
    lotAreaMax: z.number().optional(),
    assessTotMin: z.number().optional(),
    assessTotMax: z.number().optional(),
    ownerType: z.string().optional(),
    zipcode: z.string().optional(),
    councilDistrict: z.string().optional(),
    communityDistrict: z.string().optional(),
    numFloorsMin: z.number().optional(),
    numFloorsMax: z.number().optional(),
    bldgAreaMin: z.number().optional(),
    bldgAreaMax: z.number().optional(),
    resFARMin: z.number().optional(),
    resFARMax: z.number().optional(),
    commFARMin: z.number().optional(),
    commFARMax: z.number().optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('Omit to fetch all pages'),
  }),
  outputSchema: plutoSearchResponseSchema,
  execute: async ({
    neighborhood,
    geojsonDataId,
    geometry,
    borough,
    zoningDistrict,
    landUse,
    buildingClass,
    yearBuiltMin,
    yearBuiltMax,
    lotAreaMin,
    lotAreaMax,
    assessTotMin,
    assessTotMax,
    ownerType,
    zipcode,
    councilDistrict,
    communityDistrict,
    numFloorsMin,
    numFloorsMax,
    bldgAreaMin,
    bldgAreaMax,
    resFARMin,
    resFARMax,
    commFARMin,
    commFARMax,
    limit,
  }): Promise<PlutoSearchResponse> => {
    try {
      // Resolve geometry if neighborhood or geojsonDataId provided
      let filterPolygon: number[][][] | null = null;
      if (!geometry && neighborhood) {
        const neighborhoods = await searchNYCNeighborhoods({
          searchTerm: neighborhood,
        });
        const n = neighborhoods?.[0];
        if (n?.geojsonDataId) {
          const gAny = (await getGeoJSONDataById({
            id: n.geojsonDataId,
          })) as any;
          const data = Array.isArray(gAny) ? gAny[0]?.data : gAny?.data;
          if (data?.type === 'Polygon') filterPolygon = data.coordinates;
          else if (data?.type === 'MultiPolygon')
            filterPolygon = data.coordinates[0];
        }
      }
      if (!filterPolygon && geojsonDataId) {
        const gAny = (await getGeoJSONDataById({ id: geojsonDataId })) as any;
        const data = Array.isArray(gAny) ? gAny[0]?.data : gAny?.data;
        if (data?.type === 'Polygon') filterPolygon = data.coordinates;
        else if (data?.type === 'MultiPolygon')
          filterPolygon = data.coordinates[0];
      }
      if (!filterPolygon && geometry) {
        if (geometry.type === 'Polygon')
          filterPolygon = geometry.coordinates as any;
        else if (geometry.type === 'MultiPolygon')
          filterPolygon = (geometry.coordinates as any)[0];
      }

      // Build WHERE filters
      const whereParts: string[] = [];
      if (borough) {
        const b = borough.toLowerCase();
        const bcode = b.startsWith('man')
          ? 'MN'
          : b.startsWith('bronx')
            ? 'BX'
            : b.startsWith('brook')
              ? 'BK'
              : b.startsWith('que')
                ? 'QN'
                : b.startsWith('stat')
                  ? 'SI'
                  : '';
        if (bcode) whereParts.push(`Borough='${bcode}'`);
      }
      if (zoningDistrict) {
        whereParts.push(
          `(ZoneDist1='${zoningDistrict}' OR ZoneDist2='${zoningDistrict}' OR ZoneDist3='${zoningDistrict}' OR ZoneDist4='${zoningDistrict}')`,
        );
      }
      if (landUse) whereParts.push(`LandUse='${landUse}'`);
      if (buildingClass) whereParts.push(`BldgClass='${buildingClass}'`);
      if (yearBuiltMin !== undefined)
        whereParts.push(`YearBuilt>=${yearBuiltMin}`);
      if (yearBuiltMax !== undefined)
        whereParts.push(`YearBuilt<=${yearBuiltMax}`);
      if (lotAreaMin !== undefined) whereParts.push(`LotArea>=${lotAreaMin}`);
      if (lotAreaMax !== undefined) whereParts.push(`LotArea<=${lotAreaMax}`);
      if (assessTotMin !== undefined)
        whereParts.push(`AssessTot>=${assessTotMin}`);
      if (assessTotMax !== undefined)
        whereParts.push(`AssessTot<=${assessTotMax}`);
      if (ownerType) whereParts.push(`OwnerType='${ownerType}'`);
      if (zipcode) whereParts.push(`ZipCode='${zipcode}'`);
      if (councilDistrict) whereParts.push(`Council='${councilDistrict}'`);
      if (communityDistrict) whereParts.push(`CD='${communityDistrict}'`);
      if (numFloorsMin !== undefined)
        whereParts.push(`NumFloors>=${numFloorsMin}`);
      if (numFloorsMax !== undefined)
        whereParts.push(`NumFloors<=${numFloorsMax}`);
      if (bldgAreaMin !== undefined)
        whereParts.push(`BldgArea>=${bldgAreaMin}`);
      if (bldgAreaMax !== undefined)
        whereParts.push(`BldgArea<=${bldgAreaMax}`);
      if (resFARMin !== undefined) whereParts.push(`ResidFAR>=${resFARMin}`);
      if (resFARMax !== undefined) whereParts.push(`ResidFAR<=${resFARMax}`);
      if (commFARMin !== undefined) whereParts.push(`CommFAR>=${commFARMin}`);
      if (commFARMax !== undefined) whereParts.push(`CommFAR<=${commFARMax}`);

      const baseUrl =
        'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MapPLUTO/FeatureServer/0/query';
      const baseParams = new URLSearchParams({
        where: whereParts.length ? whereParts.join(' AND ') : '1=1',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson',
        orderByFields: 'OBJECTID',
      });
      if (filterPolygon) {
        const geometryBody = JSON.stringify({
          rings: filterPolygon,
          spatialReference: { wkid: 4326 },
        });
        baseParams.set('geometry', geometryBody);
        baseParams.set('geometryType', 'esriGeometryPolygon');
        baseParams.set('inSR', '4326');
        baseParams.set('spatialRel', 'esriSpatialRelIntersects');
      }

      // Pagination loop
      const pageSize = 2000;
      const allFeatures: any[] = [];
      let resultOffset = 0;
      let fetched = 0;
      let keepFetching = true;
      while (keepFetching) {
        const currentCount = limit
          ? Math.min(pageSize, Math.max(1, limit - fetched))
          : pageSize;
        const params = new URLSearchParams(baseParams);
        params.set('resultRecordCount', String(currentCount));
        params.set('resultOffset', String(resultOffset));
        params.set('returnExceededLimitFeatures', 'true');
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        if (!res.ok) {
          throw new ChatSDKError(
            'bad_request:api',
            `ArcGIS request failed: ${res.status}`,
          );
        }
        const data = await res.json();
        if ((data as any)?.error) {
          throw new ChatSDKError(
            'bad_request:api',
            `ArcGIS error: ${(data as any).error?.message || 'Unknown error'}`,
          );
        }
        const features = Array.isArray((data as any)?.features)
          ? (data as any).features
          : [];
        allFeatures.push(...features);
        fetched += features.length;
        if (features.length < currentCount || (limit && fetched >= limit)) {
          keepFetching = false;
        } else {
          resultOffset += features.length;
        }
      }

      if (allFeatures.length === 0) {
        return {
          query: 'Parcels (no results)',
          totalResults: 0,
          results: [],
        } as any;
      }

      // Persist FeatureCollection reference
      const fc = { type: 'FeatureCollection', features: allFeatures } as any;
      const geoRef = await createGeoJSONData({
        data: fc,
        metadata: {
          type: 'pluto_parcels_unified',
          source: 'arcgis_mappluto',
          count: allFeatures.length,
        },
      });

      const resultsToMap = limit ? allFeatures.slice(0, limit) : allFeatures;
      return {
        query: filterPolygon
          ? 'Parcels (geometry + filters)'
          : 'Parcels (filters only)',
        totalResults: resultsToMap.length,
        results: resultsToMap.map((f: any) => {
          const p = f?.properties || {};
          return {
            bbl: p.BBL ? String(p.BBL) : undefined,
            borough: p.Borough || undefined,
            block: p.Block ? String(p.Block) : undefined,
            lot: p.Lot ? String(p.Lot) : undefined,
            address: p.Address || undefined,
            zipcode: p.ZipCode ? String(p.ZipCode) : undefined,
            ownerName: p.OwnerName || undefined,
            ownerType: p.OwnerType || undefined,
            landUse: p.LandUse || undefined,
            buildingClass: p.BldgClass || undefined,
            yearBuilt: p.YearBuilt ?? undefined,
            lotArea: p.LotArea ?? undefined,
            bldgArea: p.BldgArea ?? undefined,
            assessTot: p.AssessTot ?? undefined,
            numFloors: p.NumFloors ?? undefined,
            resFAR: p.ResidFAR ?? undefined,
            commFAR: p.CommFAR ?? undefined,
            facilFAR: p.FacilFAR ?? undefined,
            lotFront: p.LotFront ?? undefined,
            lotDepth: p.LotDepth ?? undefined,
            bldgFront: p.BldgFront ?? undefined,
            bldgDepth: p.BldgDepth ?? undefined,
            zoningDistrict:
              p.ZoneDist1 ||
              p.ZoneDist2 ||
              p.ZoneDist3 ||
              p.ZoneDist4 ||
              undefined,
            councilDistrict: p.Council ? String(p.Council) : undefined,
            communityDistrict: p.CD ? String(p.CD) : undefined,
            geojsonDataId: (geoRef as any)?.[0]?.id,
          } as any;
        }),
      };
    } catch (error) {
      console.error('Unified parcels tool error:', error);
      throw new ChatSDKError('bad_request:api', 'Failed to fetch parcels');
    }
  },
});
