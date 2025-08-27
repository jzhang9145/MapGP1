import { tool } from 'ai';
import { z } from 'zod';
import {
  searchNYCNeighborhoods,
  getNYCParksWithGeoJSON,
  getNYCSchoolZonesWithGeoJSON,
  getNYCCensusBlocksWithGeoJSON,
  getGeoJSONDataById,
  createGeoJSONData,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import {
  spatialAnalysisResponseSchema,
  type SpatialAnalysisResponse,
} from '@/lib/schemas';

// Simple point-in-polygon check for GeoJSON
function pointInPolygon(
  point: [number, number],
  polygon: number[][][],
): boolean {
  const x = point[0];
  const y = point[1];
  for (const ring of polygon) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      if (
        ring[i][1] > y !== ring[j][1] > y &&
        x <
          ((ring[j][0] - ring[i][0]) * (y - ring[i][1])) /
            (ring[j][1] - ring[i][1]) +
            ring[i][0]
      ) {
        inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

// Get centroid of a GeoJSON polygon
function getPolygonCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0]; // Use outer ring
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const a = xi * yj - xj * yi;
    area += a;
    x += (xi + xj) * a;
    y += (yi + yj) * a;
  }
  area *= 0.5;
  if (area === 0) return [ring[0][0], ring[0][1]]; // fallback to first point
  return [x / (6 * area), y / (6 * area)];
}

// Check if two polygons intersect (simplified)
function polygonsIntersect(poly1: number[][][], poly2: number[][][]): boolean {
  // Simple check: see if any centroid is inside the other polygon
  const centroid1 = getPolygonCentroid(poly1);
  const centroid2 = getPolygonCentroid(poly2);
  return pointInPolygon(centroid1, poly2) || pointInPolygon(centroid2, poly1);
}

export const spatialAnalysis = tool({
  description:
    'Perform spatial analysis to find features within NYC neighborhoods or areas using GeoJSON boundaries. ' +
    'USE THIS TOOL when user asks for properties/buildings/parks/schools "in [NEIGHBORHOOD]" or "within [AREA]". ' +
    'Examples: "properties in Park Slope", "buildings in DUMBO", "parks in Carroll Gardens". ' +
    'Finds parks, properties, school zones, or census blocks that spatially intersect with neighborhood boundaries. ' +
    'Can find properties by location, zoning type, building class within specific neighborhoods. ' +
    'Performs true geometric intersection using GeoJSON polygon boundaries.',
  inputSchema: z.object({
    primaryLayer: z
      .enum([
        'parks',
        'neighborhoods',
        'schoolZones',
        'censusBlocks',
        'properties',
      ])
      .describe('The main layer to search for results in'),
    filterValue: z
      .string()
      .describe(
        'Name of the neighborhood, park, or area to use as spatial filter (e.g., "Clinton Hill", "Central Park")',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe('Maximum number of results to return (omit to fetch all)'),
  }),
  outputSchema: spatialAnalysisResponseSchema,
  execute: async ({
    primaryLayer,
    filterValue,
    limit,
  }): Promise<SpatialAnalysisResponse> => {
    try {
      let filterGeometry: any = null;
      let filterDescription = '';
      const results: any[] = [];

      console.log(
        `🔍 Spatial Analysis: Finding ${primaryLayer} in/near "${filterValue}"`,
      );

      // STEP 1: Find the filter geometry (what we're searching within/near)
      // Try to find as neighborhood first
      console.log(`🔍 Searching for neighborhood: "${filterValue}"`);
      try {
        const neighborhoods = await searchNYCNeighborhoods({
          searchTerm: filterValue,
        });
        console.log(`📍 Found ${neighborhoods.length} neighborhoods`);
        if (neighborhoods.length > 0) {
          const neighborhood = neighborhoods[0];
          console.log(
            `🏘️ First neighborhood: ${neighborhood.name} (${neighborhood.borough})`,
          );
          console.log(`🔗 geojsonDataId: ${neighborhood.geojsonDataId}`);
          if (neighborhood.geojsonDataId) {
            console.log(
              `🔍 Getting GeoJSON data for ID: ${neighborhood.geojsonDataId}`,
            );
            try {
              const geoDataRaw = await getGeoJSONDataById({
                id: neighborhood.geojsonDataId,
              });
              console.log(
                `📊 GeoJSON data result:`,
                geoDataRaw ? 'Found' : 'Not found',
              );
              console.log(`📊 Is array:`, Array.isArray(geoDataRaw as any));
              // Handle both array and single object responses
              const geoDataAny: any = geoDataRaw as any;
              const geoRecord: any = Array.isArray(geoDataAny)
                ? geoDataAny[0]
                : geoDataAny;
              console.log(
                `📊 GeoJSON record exists:`,
                geoRecord ? 'YES' : 'NO',
              );
              console.log(`📊 GeoJSON record type:`, typeof geoRecord);
              console.log(
                `📊 GeoJSON record keys:`,
                geoRecord ? Object.keys(geoRecord) : 'none',
              );
              console.log(
                `📊 GeoJSON data property exists:`,
                !!geoRecord?.data,
              );
              console.log(`📊 GeoJSON data value:`, geoRecord?.data);
              console.log(`📊 GeoJSON data truthy:`, !!geoRecord?.data);
              // Just try to use the data regardless of the validation
              if (geoRecord?.data?.coordinates) {
                console.log(
                  `✅ BYPASSING VALIDATION - Using GeoJSON data directly`,
                );
                filterGeometry = geoRecord.data;
                filterDescription = `${neighborhood.name} neighborhood in ${neighborhood.borough}`;
                console.log(
                  `✅ Found neighborhood boundary for: ${filterDescription}`,
                );
              } else {
                console.log(`❌ Still failing - checking individual parts:`);
                console.log(`  - geoRecord exists:`, !!geoRecord);
                console.log(`  - geoRecord.data exists:`, !!geoRecord?.data);
                console.log(
                  `  - coordinates exist:`,
                  !!geoRecord?.data?.coordinates,
                );
                console.log(
                  `❌ Data structure:`,
                  JSON.stringify(geoDataAny, null, 2).substring(0, 300),
                );
              }
            } catch (geoError) {
              console.log(`❌ Error getting GeoJSON data:`, geoError);
            }
          } else {
            console.log(
              `❌ No geojsonDataId for neighborhood ${neighborhood.name}`,
            );
          }
        } else {
          console.log(`❌ No neighborhoods found for "${filterValue}"`);
        }
      } catch (searchError) {
        console.log(`❌ Error searching neighborhoods:`, searchError);
      }

      // If not found as neighborhood, try as park
      if (!filterGeometry) {
        const parks = await getNYCParksWithGeoJSON({
          searchTerm: filterValue,
          limit: 1,
        });
        if (parks.length > 0 && parks[0].geojson) {
          filterGeometry = parks[0].geojson;
          filterDescription = `${parks[0].name || parks[0].signname} park`;
          console.log(`✅ Found park boundary for: ${filterDescription}`);
        }
      }

      // If still not found, try as school zone
      if (!filterGeometry) {
        const schoolZones = await getNYCSchoolZonesWithGeoJSON({
          searchTerm: filterValue,
          limit: 1,
        });
        if (schoolZones.length > 0 && schoolZones[0].geojson) {
          filterGeometry = schoolZones[0].geojson;
          filterDescription = `${schoolZones[0].schoolName || schoolZones[0].dbn} school zone`;
          console.log(
            `✅ Found school zone boundary for: ${filterDescription}`,
          );
        }
      }

      if (!filterGeometry) {
        throw new ChatSDKError(
          'bad_request:api',
          `Could not find boundary data for "${filterValue}". Try searching for a known neighborhood, park, or school zone.`,
        );
      }

      // Ensure we have valid polygon coordinates
      let filterPolygon: number[][][] | null = null;
      if (filterGeometry.type === 'Polygon') {
        filterPolygon = filterGeometry.coordinates;
      } else if (filterGeometry.type === 'MultiPolygon') {
        // Use the first polygon for simplicity
        filterPolygon = filterGeometry.coordinates[0];
      }

      if (!filterPolygon) {
        throw new ChatSDKError(
          'bad_request:api',
          `Invalid geometry type for "${filterValue}". Expected Polygon or MultiPolygon.`,
        );
      }

      // STEP 2: Perform spatial analysis using GeoJSON intersection
      console.log(
        `🎯 Performing GeoJSON spatial analysis: ${primaryLayer} within ${filterDescription}`,
      );

      if (primaryLayer === 'parks') {
        // Get all parks in the same borough for efficiency
        const boroughCode = getBoroughCodeFromNeighborhood(filterDescription);
        console.log(`🏙️ Filter description: "${filterDescription}"`);
        console.log(`🏙️ Borough code extracted: "${boroughCode}"`);
        const allParks = await getNYCParksWithGeoJSON({
          borough: boroughCode,
          limit: 200, // Get more to check spatially
        });
        console.log(
          `📍 Checking ${allParks.length} parks for spatial intersection...`,
        );
        let checkedCount = 0;
        let parksWithGeoJSON = 0;
        let validPolygonCount = 0;
        for (const park of allParks) {
          checkedCount++;
          if (!park.geojson) {
            if (checkedCount <= 3) {
              console.log(
                `❌ Park ${checkedCount}: ${park.name || 'Unnamed'} - No GeoJSON`,
              );
            }
            continue;
          }
          parksWithGeoJSON++;
          // Log geometry type for first few parks
          if (checkedCount <= 5) {
            console.log(
              `🔍 Park ${checkedCount}: ${park.name || 'Unnamed'} - Geometry type: ${(park.geojson as any)?.type}`,
            );
          }
          // Handle GeoJSON Feature vs direct geometry
          const parkGeo: any = park.geojson as any;
          let geometry: any = parkGeo;
          if (parkGeo?.type === 'Feature') {
            geometry = parkGeo.geometry;
            if (checkedCount <= 3) {
              console.log(
                `📍 Park ${checkedCount}: ${park.name || 'Unnamed'} - Feature with geometry type: ${geometry?.type}`,
              );
            }
          }
          if (!geometry || !geometry?.type) {
            if (checkedCount <= 3) {
              console.log(
                `❌ Park ${checkedCount}: ${park.name || 'Unnamed'} - No valid geometry`,
              );
            }
            continue;
          }
          let parkPolygon: number[][][] | null = null;
          if (geometry?.type === 'Polygon') {
            parkPolygon = geometry?.coordinates as any;
          } else if (geometry?.type === 'MultiPolygon') {
            parkPolygon = (geometry?.coordinates as any)[0];
          } else if (geometry?.type === 'Point') {
            // Handle Point geometry - check if point is inside polygon
            const point = geometry?.coordinates as [number, number];
            if (checkedCount <= 3) {
              console.log(
                `📍 Park ${checkedCount}: ${park.name || 'Unnamed'} - Point [${point[0]}, ${point[1]}]`,
              );
            }
            if (pointInPolygon(point, filterPolygon)) {
              console.log(
                `✅ Point park intersects: ${park.name || park.signname} at [${point[0]}, ${point[1]}]`,
              );
              // Store GeoJSON separately and return reference ID
              const geoRef = await createGeoJSONData({
                data: park.geojson,
                metadata: {
                  type: 'park_point',
                  source: 'spatial_analysis',
                  name: park.name || park.signname,
                  analysisQuery: `parks within ${filterValue}`,
                },
              });
              results.push({
                id: park.id,
                layerType: 'parks',
                name: park.name,
                signname: park.signname,
                borough: park.borough,
                address: park.address,
                acreage: park.acreage,
                typecategory: park.typecategory,
                geojsonDataId: (geoRef as any)?.[0]?.id || (geoRef as any)?.id,
                analysisQuery: `parks within ${filterValue}`,
                spatialRelation: 'within',
                filterDescription: filterDescription,
              });
              if (limit !== undefined && results.length >= limit) break;
            }
            continue;
          }
          if (parkPolygon) {
            validPolygonCount++;
            if (checkedCount <= 3) {
              console.log(
                `📍 Park ${checkedCount}: ${park.name || 'Unnamed'} - ${(park.geojson as any)?.type} with ${parkPolygon.length} rings`,
              );
            }
          }
          // Special debugging for Carroll Park
          if (
            park.name?.toLowerCase()?.includes('carroll') ||
            park.signname?.toLowerCase()?.includes('carroll')
          ) {
            console.log(`🔍 CARROLL PARK DEBUG: ${park.name || park.signname}`);
            console.log(`🔍 Has parkPolygon: ${!!parkPolygon}`);
            if (parkPolygon) {
              const intersects = polygonsIntersect(filterPolygon, parkPolygon);
              console.log(
                `🔍 Intersects with ${filterDescription}: ${intersects}`,
              );
            }
          }
          if (parkPolygon && polygonsIntersect(filterPolygon, parkPolygon)) {
            console.log(`✅ Park intersects: ${park.name || park.signname}`);
            // Store GeoJSON separately and return reference ID
            const geoRef = await createGeoJSONData({
              data: park.geojson,
              metadata: {
                type: 'park_polygon',
                source: 'spatial_analysis',
                name: park.name || park.signname,
                analysisQuery: `parks intersecting ${filterValue}`,
              },
            });
            results.push({
              id: park.id,
              layerType: 'parks',
              name: park.name,
              signname: park.signname,
              borough: park.borough,
              address: park.address,
              acreage: park.acreage,
              typecategory: park.typecategory,
              geojsonDataId: (geoRef as any)?.[0]?.id || (geoRef as any)?.id,
              analysisQuery: `parks intersecting ${filterValue}`,
              spatialRelation: 'intersects',
              filterDescription: filterDescription,
            });
            if (limit !== undefined && results.length >= limit) break;
          }
        }
        console.log(`📊 Spatial Analysis Summary:`);
        console.log(`   - Total parks checked: ${checkedCount}`);
        console.log(`   - Parks with GeoJSON: ${parksWithGeoJSON}`);
        console.log(`   - Valid polygons: ${validPolygonCount}`);
        console.log(`   - Results found: ${results.length}`);
        console.log(
          `📊 Found ${results.length} parks intersecting ${filterDescription}`,
        );
      } else if (primaryLayer === 'neighborhoods') {
        // Return the filter neighborhood itself plus nearby ones
        const allNeighborhoods = await searchNYCNeighborhoods({
          searchTerm: '',
        });
        for (const neighborhood of allNeighborhoods.slice(0, 50)) {
          if (!neighborhood.geojsonDataId) continue;
          const geoDataAny = (await getGeoJSONDataById({
            id: neighborhood.geojsonDataId,
          })) as any;
          if (!geoDataAny?.data) continue;
          let neighborhoodPolygon: number[][][] | null = null;
          if (geoDataAny.data?.type === 'Polygon') {
            neighborhoodPolygon = geoDataAny.data?.coordinates as any;
          } else if (geoDataAny.data?.type === 'MultiPolygon') {
            neighborhoodPolygon = (geoDataAny.data?.coordinates as any)[0];
          }
          if (
            neighborhoodPolygon &&
            polygonsIntersect(filterPolygon, neighborhoodPolygon)
          ) {
            // Use existing geojsonDataId instead of creating new one
            results.push({
              id: neighborhood.id,
              layerType: 'neighborhoods',
              name: neighborhood.name,
              borough: neighborhood.borough,
              geojsonDataId: neighborhood.geojsonDataId,
              analysisQuery: `neighborhoods intersecting ${filterValue}`,
              spatialRelation: 'intersects',
              filterDescription: filterDescription,
            });
            if (limit !== undefined && results.length >= limit) break;
          }
        }
        console.log(
          `📊 Found ${results.length} neighborhoods intersecting ${filterDescription}`,
        );
      } else if (primaryLayer === 'schoolZones') {
        // Get all school zones and check intersection
        const allSchoolZones = await getNYCSchoolZonesWithGeoJSON({
          limit: 200,
        });
        console.log(
          `📍 Checking ${allSchoolZones.length} school zones for spatial intersection...`,
        );
        for (const zone of allSchoolZones) {
          if (!zone.geojson) continue;
          let zonePolygon: number[][][] | null = null;
          if ((zone.geojson as any)?.type === 'Polygon') {
            zonePolygon = (zone.geojson as any)?.coordinates as any;
          } else if ((zone.geojson as any)?.type === 'MultiPolygon') {
            zonePolygon = ((zone.geojson as any)?.coordinates as any)[0];
          }
          if (zonePolygon && polygonsIntersect(filterPolygon, zonePolygon)) {
            console.log(
              `✅ School zone intersects: ${zone.schoolName || zone.dbn}`,
            );
            // Store GeoJSON separately and return reference ID
            const geoRef = await createGeoJSONData({
              data: zone.geojson,
              metadata: {
                type: 'school_zone',
                source: 'spatial_analysis',
                name: zone.schoolName || zone.dbn,
                analysisQuery: `school zones intersecting ${filterValue}`,
              },
            });
            results.push({
              id: zone.id,
              layerType: 'schoolZones',
              dbn: zone.dbn,
              schoolName: zone.schoolName,
              name: zone.schoolName,
              borough: zone.borough,
              schoolDistrict: zone.schoolDistrict,
              geojsonDataId: (geoRef as any)?.[0]?.id || (geoRef as any)?.id,
              analysisQuery: `school zones intersecting ${filterValue}`,
              spatialRelation: 'intersects',
              filterDescription: filterDescription,
            });
            if (limit !== undefined && results.length >= limit) break;
          }
        }
        console.log(
          `📊 Found ${results.length} school zones intersecting ${filterDescription}`,
        );
      } else if (primaryLayer === 'censusBlocks') {
        // Get all census blocks and check intersection
        const allCensusBlocks = await getNYCCensusBlocksWithGeoJSON({
          limit: 500, // Census blocks are small, might need more
        });
        console.log(
          `📍 Checking ${allCensusBlocks.length} census blocks for spatial intersection...`,
        );
        for (const block of allCensusBlocks) {
          if (!block.geojson) continue;
          // Handle GeoJSON Feature vs direct geometry
          const blockGeo: any = block.geojson as any;
          let geometry: any = blockGeo;
          if (blockGeo?.type === 'Feature') {
            geometry = blockGeo.geometry;
          }
          if (!geometry || !geometry.type) continue;
          let blockPolygon: number[][][] | null = null;
          if (geometry?.type === 'Polygon') {
            blockPolygon = geometry?.coordinates as any;
          } else if (geometry?.type === 'MultiPolygon') {
            blockPolygon = (geometry?.coordinates as any)[0];
          } else if (geometry?.type === 'Point') {
            // Handle Point geometry for census blocks
            const point = geometry?.coordinates as [number, number];
            if (pointInPolygon(point, filterPolygon)) {
              // Store GeoJSON separately and return reference ID
              const geoRef = await createGeoJSONData({
                data: block.geojson,
                metadata: {
                  type: 'census_block_point',
                  source: 'spatial_analysis',
                  name: `Census Block ${block.block}`,
                  analysisQuery: `census blocks within ${filterValue}`,
                },
              });
              results.push({
                id: block.id,
                layerType: 'censusBlocks',
                name: `Census Block ${block.block}`,
                geoid: block.geoid,
                tract: block.tract,
                block: block.block,
                totalPopulation: block.totalPopulation,
                medianHouseholdIncome: block.medianHouseholdIncome,
                borough: block.borough,
                geojsonDataId: (geoRef as any)?.[0]?.id || (geoRef as any)?.id,
                analysisQuery: `census blocks within ${filterValue}`,
                spatialRelation: 'within',
                filterDescription: filterDescription,
              });
              if (limit !== undefined && results.length >= limit) break;
            }
            continue;
          }
          if (blockPolygon && polygonsIntersect(filterPolygon, blockPolygon)) {
            // Store GeoJSON separately and return reference ID
            const geoRef = await createGeoJSONData({
              data: block.geojson,
              metadata: {
                type: 'census_block_polygon',
                source: 'spatial_analysis',
                name: `Census Block ${block.block}`,
                analysisQuery: `census blocks intersecting ${filterValue}`,
              },
            });
            results.push({
              id: block.id,
              layerType: 'censusBlocks',
              name: `Census Block ${block.block}`,
              geoid: block.geoid,
              tract: block.tract,
              block: block.block,
              totalPopulation: block.totalPopulation,
              medianHouseholdIncome: block.medianHouseholdIncome,
              unemploymentRate: block.unemploymentRate,
              borough: block.borough,
              geojsonDataId: (geoRef as any)?.[0]?.id || (geoRef as any)?.id,
              analysisQuery: `census blocks intersecting ${filterValue}`,
              spatialRelation: 'intersects',
              filterDescription: filterDescription,
            });
            if (limit !== undefined && results.length >= limit) break;
          }
        }
        console.log(
          `📊 Found ${results.length} census blocks intersecting ${filterDescription}`,
        );
      } else if (primaryLayer === 'properties') {
        // Query MapPLUTO directly using the actual neighborhood polygon to avoid transfer-limit bbox overfetch
        const geometry = JSON.stringify({
          rings: filterPolygon,
          spatialReference: { wkid: 4326 },
        });
        // Auto-pagination: fetch all pages if limit is omitted
        const pageSize = 2000;
        let resultOffset = 0;
        const collected: any[] = [];
        let keepFetching = true;
        const baseUrl =
          'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MapPLUTO/FeatureServer/0/query';
        while (keepFetching) {
          const currentCount =
            limit !== undefined
              ? Math.min(pageSize, Math.max(1, limit - collected.length))
              : pageSize;
          const params = new URLSearchParams({
            where: '1=1',
            geometry,
            geometryType: 'esriGeometryPolygon',
            inSR: '4326',
            spatialRel: 'esriSpatialRelIntersects',
            outFields: '*',
            returnGeometry: 'true',
            outSR: '4326',
            f: 'geojson',
            resultRecordCount: String(currentCount),
            resultOffset: String(resultOffset),
            orderByFields: 'OBJECTID',
            returnExceededLimitFeatures: 'true',
          });
          const body = params.toString();
          const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
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
          const features = Array.isArray(data?.features) ? data.features : [];
          collected.push(...features);
          resultOffset += features.length;
          if (
            features.length < currentCount ||
            (limit !== undefined && collected.length >= limit)
          ) {
            keepFetching = false;
          }
        }
        console.log(
          `📍 Checking ${collected.length} properties for spatial intersection...`,
        );
        // Store all properties as a single FeatureCollection for efficiency
        const featureCollection = {
          type: 'FeatureCollection',
          features: limit !== undefined ? collected.slice(0, limit) : collected,
        };
        const geoRef = await createGeoJSONData({
          data: featureCollection,
          metadata: {
            type: 'properties_collection',
            source: 'spatial_analysis_arcgis',
            count: featureCollection.features.length,
            analysisQuery: `properties within ${filterValue}`,
            filterDescription: filterDescription,
          },
        });
        const geoRefId = (geoRef as any)?.[0]?.id || (geoRef as any)?.id;

        const toProcess = featureCollection.features;
        for (const f of toProcess) {
          const p = f?.properties || {};
          const geom = f?.geometry;
          if (!geom) continue;
          results.push({
            id: p.OBJECTID || p.BBL || `${p.Block}-${p.Lot}`,
            layerType: 'properties',
            name: p.Address || `Block ${p.Block}, Lot ${p.Lot}`,
            bbl: p.BBL,
            address: p.Address,
            borough: p.Borough,
            ownername: p.OwnerName,
            bldgclass: p.BldgClass,
            landuse: p.LandUse,
            zonedist1: p.ZoneDist1,
            assesstot: p.AssessTot,
            lotarea: p.LotArea,
            bldgarea: p.BldgArea,
            yearbuilt: p.YearBuilt,
            geojsonDataId: geoRefId,
            analysisQuery: `properties within ${filterValue}`,
            spatialRelation: 'intersects',
            filterDescription: filterDescription,
          });
          if (limit !== undefined && results.length >= limit) break;
        }
        console.log(
          `📊 Found ${results.length} properties intersecting ${filterDescription}`,
        );
      }

      return {
        results,
        query: `Find ${primaryLayer} spatially intersecting ${filterDescription}`,
        totalResults: results.length,
        spatialRelation: 'intersects',
        filterDescription: filterDescription,
      };
    } catch (error) {
      console.error('Spatial analysis error:', error);
      if (error instanceof ChatSDKError) {
        throw error;
      }
      throw new ChatSDKError(
        'bad_request:database',
        'Failed to perform spatial analysis. The GeoJSON data may be invalid or missing.',
      );
    }
  },
});

// Helper function to get borough code from description
function getBoroughCodeFromNeighborhood(
  description: string,
): string | undefined {
  if (description.includes('Manhattan')) return 'M';
  if (description.includes('Brooklyn')) return 'B';
  if (description.includes('Queens')) return 'Q';
  if (description.includes('Bronx')) return 'X';
  if (description.includes('Staten Island')) return 'R';
  return undefined;
}
