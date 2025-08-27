import { tool } from 'ai';
import { z } from 'zod';
import { createGeoJSONData } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import {
  plutoSearchResponseSchema,
  type PlutoSearchResponse,
} from '@/lib/schemas';

export const pluto = tool({
  description:
    "Get NYC PLUTO (Primary Land Use Tax Lot Output) data from NYC Planning's MapPLUTO ArcGIS service (live). Returns detailed information about tax lots including ownership, land use, building characteristics, zoning, and geographic data. Always fetches remotely to ensure fresh data.",
  inputSchema: z.object({
    arcgisUrl: z
      .string()
      .url()
      .optional()
      .describe(
        'Optional: full ArcGIS MapPLUTO query URL (returns GeoJSON). When provided, data is fetched live instead of local DB.',
      ),
    bbl: z
      .string()
      .optional()
      .describe('Borough-Block-Lot identifier (e.g., "1000010001")'),
    borough: z
      .string()
      .optional()
      .describe(
        'Filter by borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)',
      ),
    search: z
      .string()
      .optional()
      .describe(
        'Search term for address, owner name, land use, building class, or zoning district',
      ),
    landUse: z
      .string()
      .optional()
      .describe('Filter by land use classification'),
    buildingClass: z
      .string()
      .optional()
      .describe('Filter by building classification'),
    zoningDistrict: z.string().optional().describe('Filter by zoning district'),
    yearBuiltMin: z.number().optional().describe('Minimum year built'),
    yearBuiltMax: z.number().optional().describe('Maximum year built'),
    lotAreaMin: z
      .number()
      .optional()
      .describe('Minimum lot area in square feet'),
    lotAreaMax: z
      .number()
      .optional()
      .describe('Maximum lot area in square feet'),
    areaId: z
      .string()
      .optional()
      .describe(
        'Chat ID to get PLUTO data for the currently selected area in that chat',
      ),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of lots to return (omit to auto-paginate)'),
  }),
  outputSchema: plutoSearchResponseSchema,
  execute: async ({
    arcgisUrl,
    bbl,
    borough,
    search,
    landUse,
    buildingClass,
    zoningDistrict,
    yearBuiltMin,
    yearBuiltMax,
    lotAreaMin,
    lotAreaMax,
    areaId,
    limit,
  }): Promise<PlutoSearchResponse> => {
    try {
      // Build ArcGIS params if URL not provided
      let url = arcgisUrl;
      const baseUrl =
        'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MapPLUTO/FeatureServer/0/query';
      let baseParams: URLSearchParams | null = null;
      if (!url) {
        const whereParts: string[] = [];
        if (bbl) whereParts.push(`BBL=${encodeURIComponent(bbl)}`);
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

        baseParams = new URLSearchParams({
          where: whereParts.length ? whereParts.join(' AND ') : '1=1',
          outFields: '*',
          returnGeometry: 'true',
          outSR: '4326',
          f: 'geojson',
          orderByFields: 'OBJECTID',
        });
        if (limit) {
          baseParams.set('resultRecordCount', String(Math.min(2000, limit)));
        }
        url = `${baseUrl}?${baseParams.toString()}`;
      }
      // Fetch with pagination when limit is omitted
      const pageSize = 2000;
      const allFeatures: any[] = [];
      let fetched = 0;
      let resultOffset = 0;
      let keepFetching = true;
      while (keepFetching) {
        let res: Response;
        if (!arcgisUrl && baseParams) {
          const params = new URLSearchParams(baseParams);
          const currentCount = limit
            ? Math.min(pageSize, Math.max(1, limit - fetched))
            : pageSize;
          params.set('resultRecordCount', String(currentCount));
          params.set('resultOffset', String(resultOffset));
          params.set('returnExceededLimitFeatures', 'true');
          // Prefer POST to avoid URL length limits
          res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });
        } else {
          res = await fetch(url);
        }
        if (!res.ok) {
          throw new ChatSDKError(
            'bad_request:api',
            `ArcGIS request failed: ${res.status}`,
          );
        }
        const data = (await res.json()) as any;
        if ((data as any)?.error) {
          throw new ChatSDKError(
            'bad_request:api',
            `ArcGIS error: ${(data as any).error?.message || 'Unknown error'}`,
          );
        }
        const features: any[] = Array.isArray(data?.features)
          ? data.features
          : [];
        allFeatures.push(...features);
        fetched += features.length;
        if (
          features.length <
            (limit
              ? Math.min(pageSize, limit - (fetched - features.length))
              : pageSize) ||
          (limit && fetched >= limit)
        ) {
          keepFetching = false;
        } else {
          resultOffset += features.length;
        }
      }

      if (allFeatures.length === 0) {
        throw new ChatSDKError(
          'bad_request:api',
          'No features returned from ArcGIS',
        );
      }

      // Persist a reference FeatureCollection for map rendering
      const fc = { type: 'FeatureCollection', features: allFeatures } as any;
      const geoRef = await createGeoJSONData({
        data: fc,
        metadata: {
          type: 'pluto_lots_remote',
          source: 'arcgis_mappluto',
          url,
          count: allFeatures.length,
        },
      });

      const resultsToMap = limit ? allFeatures.slice(0, limit) : allFeatures;
      return {
        query:
          search || bbl || borough || zoningDistrict
            ? 'MapPLUTO filtered'
            : 'MapPLUTO all',
        totalResults: resultsToMap.length,
        // Do not attach huge geojson to avoid context overflows; client fetches via /api/mappluto/geojson
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
            numFloors: p.NumFloors ?? undefined,
            lotArea: p.LotArea ?? undefined,
            bldgArea: p.BldgArea ?? undefined,
            commFAR: p.CommFAR ?? undefined,
            resFAR: p.ResidFAR ?? undefined,
            facilFAR: p.FacilFAR ?? undefined,
            bldgFront: p.BldgFront ?? undefined,
            bldgDepth: p.BldgDepth ?? undefined,
            lotFront: p.LotFront ?? undefined,
            lotDepth: p.LotDepth ?? undefined,
            tract2010: p.Tract2010 ?? undefined,
            xCoord: p.XCoord ?? undefined,
            yCoord: p.YCoord ?? undefined,
            latitude: p.Latitude ?? undefined,
            longitude: p.Longitude ?? undefined,
            councilDistrict: p.Council ? String(p.Council) : undefined,
            communityDistrict: p.CD ? String(p.CD) : undefined,
            zoningDistrict:
              p.ZoneDist1 ||
              p.ZoneDist2 ||
              p.ZoneDist3 ||
              p.ZoneDist4 ||
              undefined,
            geojsonDataId: (geoRef as any)?.[0]?.id,
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching PLUTO data from ArcGIS:', error);
      throw new ChatSDKError(
        'bad_request:api',
        'Failed to fetch PLUTO data from ArcGIS',
      );
    }
  },
});
