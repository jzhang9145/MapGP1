import { tool } from 'ai';
import { z } from 'zod';
import {
  getAllPlutoLots,
  getPlutoLotsByBorough,
  searchPlutoLots,
  getPlutoLotByBBL,
  filterPlutoLots,
  createGeoJSONData,
  getGeoJSONDataById,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import {
  plutoSearchResponseSchema,
  type PlutoSearchResponse,
} from '@/lib/schemas';

export const pluto = tool({
  description:
    'Get NYC PLUTO (Primary Land Use Tax Lot Output) data from the local database. Returns detailed information about tax lots including ownership, land use, building characteristics, zoning, and geographic data. PLUTO contains comprehensive data for every tax lot in New York City.',
  inputSchema: z.object({
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
      .describe('Maximum number of lots to return (default: 50)'),
  }),
  outputSchema: plutoSearchResponseSchema,
  execute: async ({
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
    limit = 50,
  }): Promise<PlutoSearchResponse> => {
    try {
      let lots: any[];

      // Query based on parameters
      if (bbl) {
        // Get specific lot by BBL
        const lotResult = await getPlutoLotByBBL({ bbl });
        lots = lotResult || [];
      } else if (areaId) {
        // Get PLUTO data for the currently selected area
        try {
          lots = await getAllPlutoLots({ limit });
        } catch (error) {
          console.error('Error getting PLUTO data by area:', error);
          // Fallback to getting all lots if area query fails
          lots = await getAllPlutoLots({ limit });
        }
      } else if (search) {
        // Search by various fields
        lots = await searchPlutoLots({ searchTerm: search, limit });
      } else if (
        borough ||
        landUse ||
        buildingClass ||
        zoningDistrict ||
        yearBuiltMin ||
        yearBuiltMax ||
        lotAreaMin ||
        lotAreaMax
      ) {
        // Apply filters
        lots = await filterPlutoLots({
          borough,
          landUse,
          buildingClass,
          zoningDistrict,
          yearBuiltMin,
          yearBuiltMax,
          lotAreaMin,
          lotAreaMax,
          limit,
        });
      } else if (borough) {
        // Filter by borough only
        lots = await getPlutoLotsByBorough({ borough });
      } else {
        // Get all lots with limit
        lots = await getAllPlutoLots({ limit });
      }

      if (!lots || lots.length === 0) {
        throw new ChatSDKError(
          'bad_request:api',
          'No PLUTO lots found matching the criteria',
        );
      }

      // Apply limit
      const limitedLots = lots.slice(0, limit);

      // If only one result, return it directly
      if (limitedLots.length === 1) {
        const lot = limitedLots[0];
        return {
          query:
            bbl || search || borough || areaId
              ? `Area: ${areaId}`
              : 'All PLUTO lots',
          totalResults: 1,
          results: [
            {
              bbl: lot.bbl,
              borough: lot.borough,
              block: lot.block,
              lot: lot.lot,
              address: lot.address,
              zipcode: lot.zipcode,
              ownerName: lot.ownerName,
              ownerType: lot.ownerType,
              landUse: lot.landUse,
              landUseCode: lot.landUseCode,
              buildingClass: lot.buildingClass,
              buildingClassCode: lot.buildingClassCode,
              yearBuilt: lot.yearBuilt ? Number(lot.yearBuilt) : undefined,
              yearAltered: lot.yearAltered
                ? Number(lot.yearAltered)
                : undefined,
              numFloors: lot.numFloors ? Number(lot.numFloors) : undefined,
              numStories: lot.numStories ? Number(lot.numStories) : undefined,
              lotArea: lot.lotArea ? Number(lot.lotArea) : undefined,
              bldgArea: lot.bldgArea ? Number(lot.bldgArea) : undefined,
              commFAR: lot.commFAR ? Number(lot.commFAR) : undefined,
              resFAR: lot.resFAR ? Number(lot.resFAR) : undefined,
              facilFAR: lot.facilFAR ? Number(lot.facilFAR) : undefined,
              bldgFront: lot.bldgFront ? Number(lot.bldgFront) : undefined,
              bldgDepth: lot.bldgDepth ? Number(lot.bldgDepth) : undefined,
              lotFront: lot.lotFront ? Number(lot.lotFront) : undefined,
              lotDepth: lot.lotDepth ? Number(lot.lotDepth) : undefined,
              bldgClass: lot.bldgClass,
              tract2010: lot.tract2010,
              xCoord: lot.xCoord ? Number(lot.xCoord) : undefined,
              yCoord: lot.yCoord ? Number(lot.yCoord) : undefined,
              latitude: lot.latitude ? Number(lot.latitude) : undefined,
              longitude: lot.longitude ? Number(lot.longitude) : undefined,
              councilDistrict: lot.councilDistrict,
              communityDistrict: lot.communityDistrict,
              policePrecinct: lot.policePrecinct,
              fireCompany: lot.fireCompany,
              fireBattalion: lot.fireBattalion,
              fireDivision: lot.fireDivision,
              healthArea: lot.healthArea,
              healthCenterDistrict: lot.healthCenterDistrict,
              schoolDistrict: lot.schoolDistrict,
              voterPrecinct: lot.voterPrecinct,
              electionDistrict: lot.electionDistrict,
              assemblyDistrict: lot.assemblyDistrict,
              senateDistrict: lot.senateDistrict,
              congressionalDistrict: lot.congressionalDistrict,
              sanitationDistrict: lot.sanitationDistrict,
              sanitationSub: lot.sanitationSub,
              zoningDistrict: lot.zoningDistrict,
              overlayDistrict1: lot.overlayDistrict1,
              overlayDistrict2: lot.overlayDistrict2,
              specialDistrict1: lot.specialDistrict1,
              specialDistrict2: lot.specialDistrict2,
              specialDistrict3: lot.specialDistrict3,
              easements: lot.easements,
              landmark: lot.landmark,
              far: lot.far ? Number(lot.far) : undefined,
              irrLotCode: lot.irrLotCode,
              lotType: lot.lotType,
              bsmtCode: lot.bsmtCode,
              assessLand: lot.assessLand ? Number(lot.assessLand) : undefined,
              assessTot: lot.assessTot ? Number(lot.assessTot) : undefined,
              exemptLand: lot.exemptLand ? Number(lot.exemptLand) : undefined,
              exemptTot: lot.exemptTot ? Number(lot.exemptTot) : undefined,
              yearAlter1: lot.yearAlter1 ? Number(lot.yearAlter1) : undefined,
              yearAlter2: lot.yearAlter2 ? Number(lot.yearAlter2) : undefined,
              histDist: lot.histDist,
              lstAction: lot.lstAction,
              lstStatus: lot.lstStatus,
              lstDate: lot.lstDate,
              lstReason: lot.lstReason,
              geojsonDataId: lot.geojsonDataId,
            },
          ],
        };
      }

      // Create GeoJSON feature collection for multiple results
      const features = await Promise.all(
        limitedLots.map(async (lot) => {
          let geometry = {
            // Fallback to point if no geometry stored
            type: 'Point' as const,
            coordinates: [
              lot.longitude ? Number(lot.longitude) : 0,
              lot.latitude ? Number(lot.latitude) : 0,
            ] as [number, number],
          };

          // Try to get geometry from GeoJSONData table
          if (lot.geojsonDataId) {
            try {
              const geojsonData = await getGeoJSONDataById({
                id: lot.geojsonDataId,
              });
              if (geojsonData?.[0]?.data) {
                geometry = geojsonData[0].data as any;
              }
            } catch (error) {
              console.warn(`Failed to fetch geometry for ${lot.bbl}:`, error);
            }
          }

          return {
            type: 'Feature' as const,
            properties: {
              bbl: lot.bbl,
              borough: lot.borough,
              block: lot.block,
              lot: lot.lot,
              address: lot.address,
              zipcode: lot.zipcode,
              ownerName: lot.ownerName,
              ownerType: lot.ownerType,
              landUse: lot.landUse,
              landUseCode: lot.landUseCode,
              buildingClass: lot.buildingClass,
              buildingClassCode: lot.buildingClassCode,
              yearBuilt: lot.yearBuilt ? Number(lot.yearBuilt) : undefined,
              yearAltered: lot.yearAltered
                ? Number(lot.yearAltered)
                : undefined,
              numFloors: lot.numFloors ? Number(lot.numFloors) : undefined,
              numStories: lot.numStories ? Number(lot.numStories) : undefined,
              lotArea: lot.lotArea ? Number(lot.lotArea) : undefined,
              bldgArea: lot.bldgArea ? Number(lot.bldgArea) : undefined,
              commFAR: lot.commFAR ? Number(lot.commFAR) : undefined,
              resFAR: lot.resFAR ? Number(lot.resFAR) : undefined,
              facilFAR: lot.facilFAR ? Number(lot.facilFAR) : undefined,
              bldgFront: lot.bldgFront ? Number(lot.bldgFront) : undefined,
              bldgDepth: lot.bldgDepth ? Number(lot.bldgDepth) : undefined,
              lotFront: lot.lotFront ? Number(lot.lotFront) : undefined,
              lotDepth: lot.lotDepth ? Number(lot.lotDepth) : undefined,
              bldgClass: lot.bldgClass,
              tract2010: lot.tract2010,
              xCoord: lot.xCoord ? Number(lot.xCoord) : undefined,
              yCoord: lot.yCoord ? Number(lot.yCoord) : undefined,
              latitude: lot.latitude ? Number(lot.latitude) : undefined,
              longitude: lot.longitude ? Number(lot.longitude) : undefined,
              councilDistrict: lot.councilDistrict,
              communityDistrict: lot.communityDistrict,
              policePrecinct: lot.policePrecinct,
              fireCompany: lot.fireCompany,
              fireBattalion: lot.fireBattalion,
              fireDivision: lot.fireDivision,
              healthArea: lot.healthArea,
              healthCenterDistrict: lot.healthCenterDistrict,
              schoolDistrict: lot.schoolDistrict,
              voterPrecinct: lot.voterPrecinct,
              electionDistrict: lot.electionDistrict,
              assemblyDistrict: lot.assemblyDistrict,
              senateDistrict: lot.senateDistrict,
              congressionalDistrict: lot.congressionalDistrict,
              sanitationDistrict: lot.sanitationDistrict,
              sanitationSub: lot.sanitationSub,
              zoningDistrict: lot.zoningDistrict,
              overlayDistrict1: lot.overlayDistrict1,
              overlayDistrict2: lot.overlayDistrict2,
              specialDistrict1: lot.specialDistrict1,
              specialDistrict2: lot.specialDistrict2,
              specialDistrict3: lot.specialDistrict3,
              easements: lot.easements,
              landmark: lot.landmark,
              far: lot.far ? Number(lot.far) : undefined,
              irrLotCode: lot.irrLotCode,
              lotType: lot.lotType,
              bsmtCode: lot.bsmtCode,
              assessLand: lot.assessLand ? Number(lot.assessLand) : undefined,
              assessTot: lot.assessTot ? Number(lot.assessTot) : undefined,
              exemptLand: lot.exemptLand ? Number(lot.exemptLand) : undefined,
              exemptTot: lot.exemptTot ? Number(lot.exemptTot) : undefined,
              yearAlter1: lot.yearAlter1 ? Number(lot.yearAlter1) : undefined,
              yearAlter2: lot.yearAlter2 ? Number(lot.yearAlter2) : undefined,
              histDist: lot.histDist,
              lstAction: lot.lstAction,
              lstStatus: lot.lstStatus,
              lstDate: lot.lstDate,
              lstReason: lot.lstReason,
              geojsonDataId: lot.geojsonDataId,
            },
            geometry: geometry,
          };
        }),
      );

      const geojson = {
        type: 'FeatureCollection' as const,
        features: features,
      };

      // Store the GeoJSON data and get the ID
      const geojsonData = await createGeoJSONData({
        data: geojson,
        metadata: {
          type: 'pluto_lots',
          source: 'Local Database',
          dataset: 'NYC PLUTO (Primary Land Use Tax Lot Output)',
          bbl: bbl || null,
          borough: borough || null,
          search: search || null,
          count: limitedLots.length,
        },
      });

      return {
        query:
          bbl || search || borough || areaId
            ? `Area: ${areaId}`
            : 'All PLUTO lots',
        totalResults: limitedLots.length,
        results: limitedLots.map((lot) => ({
          bbl: lot.bbl,
          borough: lot.borough,
          block: lot.block,
          lot: lot.lot,
          address: lot.address,
          zipcode: lot.zipcode,
          ownerName: lot.ownerName,
          ownerType: lot.ownerType,
          landUse: lot.landUse,
          landUseCode: lot.landUseCode,
          buildingClass: lot.buildingClass,
          buildingClassCode: lot.buildingClassCode,
          yearBuilt: lot.yearBuilt ? Number(lot.yearBuilt) : undefined,
          yearAltered: lot.yearAltered ? Number(lot.yearAltered) : undefined,
          numFloors: lot.numFloors ? Number(lot.numFloors) : undefined,
          numStories: lot.numStories ? Number(lot.numStories) : undefined,
          lotArea: lot.lotArea ? Number(lot.lotArea) : undefined,
          bldgArea: lot.bldgArea ? Number(lot.bldgArea) : undefined,
          commFAR: lot.commFAR ? Number(lot.commFAR) : undefined,
          resFAR: lot.resFAR ? Number(lot.resFAR) : undefined,
          facilFAR: lot.facilFAR ? Number(lot.facilFAR) : undefined,
          bldgFront: lot.bldgFront ? Number(lot.bldgFront) : undefined,
          bldgDepth: lot.bldgDepth ? Number(lot.bldgDepth) : undefined,
          lotFront: lot.lotFront ? Number(lot.lotFront) : undefined,
          lotDepth: lot.lotDepth ? Number(lot.lotDepth) : undefined,
          bldgClass: lot.bldgClass,
          tract2010: lot.tract2010,
          xCoord: lot.xCoord ? Number(lot.xCoord) : undefined,
          yCoord: lot.yCoord ? Number(lot.yCoord) : undefined,
          latitude: lot.latitude ? Number(lot.latitude) : undefined,
          longitude: lot.longitude ? Number(lot.longitude) : undefined,
          councilDistrict: lot.councilDistrict,
          communityDistrict: lot.communityDistrict,
          policePrecinct: lot.policePrecinct,
          fireCompany: lot.fireCompany,
          fireBattalion: lot.fireBattalion,
          fireDivision: lot.fireDivision,
          healthArea: lot.healthArea,
          healthCenterDistrict: lot.healthCenterDistrict,
          schoolDistrict: lot.schoolDistrict,
          voterPrecinct: lot.voterPrecinct,
          electionDistrict: lot.electionDistrict,
          assemblyDistrict: lot.assemblyDistrict,
          senateDistrict: lot.senateDistrict,
          congressionalDistrict: lot.congressionalDistrict,
          sanitationDistrict: lot.sanitationDistrict,
          sanitationSub: lot.sanitationSub,
          zoningDistrict: lot.zoningDistrict,
          overlayDistrict1: lot.overlayDistrict1,
          overlayDistrict2: lot.overlayDistrict2,
          specialDistrict1: lot.specialDistrict1,
          specialDistrict2: lot.specialDistrict2,
          specialDistrict3: lot.specialDistrict3,
          easements: lot.easements,
          landmark: lot.landmark,
          far: lot.far ? Number(lot.far) : undefined,
          irrLotCode: lot.irrLotCode,
          lotType: lot.lotType,
          bsmtCode: lot.bsmtCode,
          assessLand: lot.assessLand ? Number(lot.assessLand) : undefined,
          assessTot: lot.assessTot ? Number(lot.assessTot) : undefined,
          exemptLand: lot.exemptLand ? Number(lot.exemptLand) : undefined,
          exemptTot: lot.exemptTot ? Number(lot.exemptTot) : undefined,
          yearAlter1: lot.yearAlter1 ? Number(lot.yearAlter1) : undefined,
          yearAlter2: lot.yearAlter2 ? Number(lot.yearAlter2) : undefined,
          histDist: lot.histDist,
          lstAction: lot.lstAction,
          lstStatus: lot.lstStatus,
          lstDate: lot.lstDate,
          lstReason: lot.lstReason,
          geojsonDataId: lot.geojsonDataId,
        })),
      };
    } catch (error) {
      console.error('Error fetching PLUTO data from database:', error);
      throw new ChatSDKError(
        'bad_request:api',
        'Failed to fetch PLUTO data from database',
      );
    }
  },
});
