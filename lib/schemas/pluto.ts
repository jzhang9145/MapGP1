import { z } from 'zod';

// PLUTO lot data schema
export const plutoLotSchema = z.object({
  bbl: z.string().describe('Borough-Block-Lot identifier'),
  borough: z.string().describe('Borough name'),
  block: z.string().describe('Block number'),
  lot: z.string().describe('Lot number'),
  address: z.string().optional().describe('Street address'),
  zipcode: z.string().optional().describe('ZIP code'),
  ownerName: z.string().optional().describe('Owner name'),
  ownerType: z.string().optional().describe('Owner type'),
  landUse: z.string().optional().describe('Land use classification'),
  landUseCode: z.string().optional().describe('Land use code'),
  buildingClass: z.string().optional().describe('Building classification'),
  buildingClassCode: z
    .string()
    .optional()
    .describe('Building classification code'),
  yearBuilt: z.number().optional().describe('Year building was built'),
  yearAltered: z.number().optional().describe('Year building was last altered'),
  numFloors: z.number().optional().describe('Number of floors'),
  numStories: z.number().optional().describe('Number of stories'),
  lotArea: z.number().optional().describe('Lot area in square feet'),
  bldgArea: z.number().optional().describe('Building area in square feet'),
  commFAR: z.number().optional().describe('Commercial Floor Area Ratio'),
  resFAR: z.number().optional().describe('Residential Floor Area Ratio'),
  facilFAR: z.number().optional().describe('Facility Floor Area Ratio'),
  bldgFront: z.number().optional().describe('Building frontage'),
  bldgDepth: z.number().optional().describe('Building depth'),
  lotFront: z.number().optional().describe('Lot frontage'),
  lotDepth: z.number().optional().describe('Lot depth'),
  bldgClass: z.string().optional().describe('Building class'),
  tract2010: z.string().optional().describe('2010 Census tract'),
  xCoord: z.number().optional().describe('X coordinate'),
  yCoord: z.number().optional().describe('Y coordinate'),
  latitude: z.number().optional().describe('Latitude'),
  longitude: z.number().optional().describe('Longitude'),
  councilDistrict: z.string().optional().describe('City Council district'),
  communityDistrict: z.string().optional().describe('Community district'),
  policePrecinct: z.string().optional().describe('Police precinct'),
  fireCompany: z.string().optional().describe('Fire company'),
  fireBattalion: z.string().optional().describe('Fire battalion'),
  fireDivision: z.string().optional().describe('Fire division'),
  healthArea: z.string().optional().describe('Health area'),
  healthCenterDistrict: z
    .string()
    .optional()
    .describe('Health center district'),
  schoolDistrict: z.string().optional().describe('School district'),
  voterPrecinct: z.string().optional().describe('Voter precinct'),
  electionDistrict: z.string().optional().describe('Election district'),
  assemblyDistrict: z.string().optional().describe('Assembly district'),
  senateDistrict: z.string().optional().describe('Senate district'),
  congressionalDistrict: z
    .string()
    .optional()
    .describe('Congressional district'),
  sanitationDistrict: z.string().optional().describe('Sanitation district'),
  sanitationSub: z.string().optional().describe('Sanitation sub-district'),
  zoningDistrict: z.string().optional().describe('Zoning district'),
  overlayDistrict1: z.string().optional().describe('Overlay district 1'),
  overlayDistrict2: z.string().optional().describe('Overlay district 2'),
  specialDistrict1: z.string().optional().describe('Special district 1'),
  specialDistrict2: z.string().optional().describe('Special district 2'),
  specialDistrict3: z.string().optional().describe('Special district 3'),
  easements: z.string().optional().describe('Easements'),
  landmark: z.string().optional().describe('Landmark status'),
  far: z.number().optional().describe('Floor Area Ratio'),
  irrLotCode: z.string().optional().describe('Irregular lot code'),
  lotType: z.string().optional().describe('Lot type'),
  bsmtCode: z.string().optional().describe('Basement code'),
  assessLand: z.number().optional().describe('Assessed land value'),
  assessTot: z.number().optional().describe('Total assessed value'),
  exemptLand: z.number().optional().describe('Exempt land value'),
  exemptTot: z.number().optional().describe('Total exempt value'),
  yearAlter1: z.number().optional().describe('Year altered 1'),
  yearAlter2: z.number().optional().describe('Year altered 2'),
  histDist: z.string().optional().describe('Historic district'),
  lstAction: z.string().optional().describe('Last action'),
  lstStatus: z.string().optional().describe('Last status'),
  lstDate: z.string().optional().describe('Last date'),
  lstReason: z.string().optional().describe('Last reason'),
  geojsonDataId: z.string().optional().describe('GeoJSON data reference ID'),
});

// PLUTO search response schema
export const plutoSearchResponseSchema = z.object({
  query: z.string().describe('Search query used'),
  totalResults: z.number().describe('Total number of results'),
  results: z.array(plutoLotSchema).describe('PLUTO lot records'),
  geojson: z.any().optional().describe('FeatureCollection for map rendering'),
  error: z.string().optional().describe('Error message if any'),
});

// PLUTO filter options schema
export const plutoFilterSchema = z.object({
  borough: z.string().optional().describe('Filter by borough'),
  landUse: z.string().optional().describe('Filter by land use'),
  buildingClass: z.string().optional().describe('Filter by building class'),
  zoningDistrict: z.string().optional().describe('Filter by zoning district'),
  yearBuiltMin: z.number().optional().describe('Minimum year built'),
  yearBuiltMax: z.number().optional().describe('Maximum year built'),
  lotAreaMin: z.number().optional().describe('Minimum lot area'),
  lotAreaMax: z.number().optional().describe('Maximum lot area'),
  limit: z.number().optional().describe('Maximum number of results'),
});

export type PlutoLot = z.infer<typeof plutoLotSchema>;
export type PlutoSearchResponse = z.infer<typeof plutoSearchResponseSchema>;
export type PlutoFilter = z.infer<typeof plutoFilterSchema>;
