import { z } from 'zod';

export const mapplutoPropertySchema = z.object({
  id: z.string(),
  bbl: z.string().describe('Borough-Block-Lot identifier (e.g., "3012380001")'),
  borough: z.string().describe('Borough name (Brooklyn, Manhattan, etc.)'),
  block: z.string().optional().describe('Block number'),
  lot: z.string().optional().describe('Lot number'),
  cd: z.string().optional().describe('Community District'),
  
  // Property Classification
  bldgclass: z.string().optional().describe('Building class (e.g., "A1", "R4", "O4")'),
  landuse: z.string().optional().describe('Land use code (01=family homes, 05=commercial, etc.)'),
  ownertype: z.string().optional().describe('Owner type (P=private, C=city, etc.)'),
  ownername: z.string().optional().describe('Owner name'),
  
  // Property Dimensions
  lotarea: z.number().nullable().optional().describe('Lot area in square feet'),
  bldgarea: z.number().nullable().optional().describe('Building area in square feet'),
  comarea: z.number().nullable().optional().describe('Commercial area in square feet'),
  resarea: z.number().nullable().optional().describe('Residential area in square feet'),
  officearea: z.number().nullable().optional().describe('Office area in square feet'),
  retailarea: z.number().nullable().optional().describe('Retail area in square feet'),
  
  // Building Details
  numbldgs: z.number().nullable().optional().describe('Number of buildings on lot'),
  numfloors: z.number().nullable().optional().describe('Number of floors'),
  unitsres: z.number().nullable().optional().describe('Number of residential units'),
  unitstotal: z.number().nullable().optional().describe('Total number of units'),
  
  // Assessment & Valuation
  assessland: z.number().nullable().optional().describe('Land assessment value in dollars'),
  assesstot: z.number().nullable().optional().describe('Total assessment value in dollars'),
  exempttot: z.number().nullable().optional().describe('Total exemptions in dollars'),
  
  // Historical Information
  yearbuilt: z.number().nullable().optional().describe('Year the building was built'),
  yearalter1: z.number().nullable().optional().describe('Year of first alteration'),
  yearalter2: z.number().nullable().optional().describe('Year of second alteration'),
  histdist: z.string().optional().describe('Historic district name'),
  landmark: z.string().optional().describe('Landmark designation'),
  
  // Floor Area Ratio (FAR)
  builtfar: z.number().nullable().optional().describe('Built floor area ratio'),
  residfar: z.number().nullable().optional().describe('Residential FAR limit'),
  commfar: z.number().nullable().optional().describe('Commercial FAR limit'),
  facilfar: z.number().nullable().optional().describe('Facility FAR limit'),
  
  // Address & Location
  address: z.string().optional().describe('Street address'),
  zipcode: z.string().optional().describe('ZIP code'),
  
  // Zoning Districts
  zonedist1: z.string().optional().describe('Primary zoning district (e.g., "R5", "M1-1", "PARK")'),
  zonedist2: z.string().optional().describe('Secondary zoning district'),
  zonedist3: z.string().optional().describe('Tertiary zoning district'),  
  zonedist4: z.string().optional().describe('Quaternary zoning district'),
  
  // GeoJSON
  geojson: z.any().describe('GeoJSON geometry for the tax lot boundary'),
});

export const mapplutoResponseSchema = z.object({
  properties: z.array(mapplutoPropertySchema).describe('Array of tax lot properties'),
  summary: z.object({
    totalProperties: z.number().describe('Total number of properties found'),
    avgAssessment: z.number().optional().describe('Average total assessment value'),
    avgLotSize: z.number().optional().describe('Average lot size in square feet'),
    avgYearBuilt: z.number().optional().describe('Average year built'),
    propertyTypes: z.record(z.number()).optional().describe('Count by building class'),
    totalAssessedValue: z.number().optional().describe('Sum of all assessed values'),
  }).optional().describe('Summary statistics for the properties'),
});

export type MapPLUTOProperty = z.infer<typeof mapplutoPropertySchema>;
export type MapPLUTOResponse = z.infer<typeof mapplutoResponseSchema>;

// Building class descriptions for better UX
export const buildingClassDescriptions: Record<string, string> = {
  // Residential
  'A1': 'Single Family Home',
  'A2': 'Two-Family Home',
  'A3': 'Three-Family Home',
  'A4': 'Multi-Family Walkup (4-6 units)',
  'A5': 'Multi-Family Walkup (7+ units)',
  'B1': 'Multi-Story Apartment (6+ stories with elevator)',
  'B2': 'Multi-Story Apartment (7-19 stories)',
  'B3': 'Multi-Story Apartment (20+ stories)',
  'B9': 'Mixed Residential & Commercial',
  
  // Commercial
  'C1': 'Walk-up Commercial',
  'C2': 'Multi-Story Commercial',
  'C3': 'Multi-Story Commercial (utility company)',
  'C4': 'Commercial Condominium',
  'C6': 'Commercial Loft',
  'C7': 'Commercial High-rise',
  'C8': 'Commercial High-rise (utility company)',
  'C9': 'Mixed Commercial & Other',
  
  // Office
  'O1': 'Office Building (1-3 stories)',
  'O2': 'Office Building (4-6 stories)',
  'O3': 'Office Building (7-19 stories)',
  'O4': 'Office Building (20+ stories)',
  'O5': 'Office Building with Commercial',
  'O6': 'Office Building (utility company)',
  'O7': 'Office Professional Building',
  'O8': 'Office Building (utility company high-rise)',
  'O9': 'Mixed Office & Other',
  
  // Retail
  'R1': 'Retail Store (1 story)',
  'R2': 'Retail Store (2+ stories)',
  'R3': 'Retail Store with Apartment',
  'R4': 'Retail Store (utility company)',
  'R5': 'Retail Store Mixed Use',
  'R6': 'Retail Store (loft)',
  'R7': 'Retail Store High-rise',
  'R8': 'Retail Store (utility company high-rise)',
  'R9': 'Mixed Retail & Other',
  
  // Industrial
  'F1': 'Factory/Industrial (1-3 stories)',
  'F2': 'Factory/Industrial (4-6 stories)',
  'F3': 'Factory/Industrial (7+ stories)',
  'F4': 'Factory/Industrial Semi-detached',
  'F5': 'Factory/Industrial with Office',
  'F8': 'Factory/Industrial (utility company)',
  'F9': 'Mixed Factory & Other',
  
  // Vacant
  'V0': 'Vacant Land (zoned residential)',
  'V1': 'Vacant Land (zoned commercial)',
  'V2': 'Vacant Land (zoned industrial)',
  'V3': 'Vacant Land (mixed zoning)',
  'V4': 'Vacant Land (institutional)',
  'V5': 'Vacant Land (other)',
  'V9': 'Vacant Land (mixed use)',
};

// Land use descriptions
export const landUseDescriptions: Record<string, string> = {
  '01': 'One Family Homes',
  '02': 'Two Family Homes',
  '03': 'Three Family Homes',
  '04': 'Multi-Family Walkup Buildings',
  '05': 'Multi-Family Elevator Buildings',
  '06': 'Mixed Residential & Commercial Buildings',
  '07': 'Hotel Units',
  '08': 'Rentals - Tourism',
  '09': 'Condominiums',
  '10': 'Cooperatives',
  '11': 'Retail Stores',
  '12': 'Department Stores',
  '13': 'Office Buildings',
  '14': 'Banks',
  '15': 'Restaurants & Bars',
  '16': 'Hotels',
  '17': 'Entertainment/Recreation',
  '18': 'Industrial & Manufacturing',
  '19': 'Parking Facilities',
  '20': 'Health Care Facilities',
  '21': 'Places of Worship',
  '22': 'Educational Facilities',
  '23': 'Transportation Facilities',
  '24': 'Public Places & Institutions',
  '25': 'Utility & Infrastructure',
  '26': 'Mixed Use Buildings',
  '27': 'Mixed Use Buildings',
  '28': 'Outdoor Recreation Facilities',
  '29': 'Vacant Land',
  '30': 'Public Housing',
  '31': 'Luxury Hotels',
};

// Helper function to get readable property description
export function getPropertyDescription(bldgclass?: string, landuse?: string): string {
  if (bldgclass && buildingClassDescriptions[bldgclass]) {
    return buildingClassDescriptions[bldgclass];
  }
  
  if (landuse && landUseDescriptions[landuse]) {
    return landUseDescriptions[landuse];
  }
  
  return 'Property';
}

// Helper function to get property type icon
export function getPropertyIcon(bldgclass?: string, landuse?: string): string {
  if (!bldgclass && !landuse) return '🏢';
  
  const code = bldgclass || '';
  
  // Residential
  if (code.startsWith('A') || ['01', '02', '03', '04', '05', '09', '10', '30'].includes(landuse || '')) {
    return '🏠';
  }
  
  // Commercial/Retail
  if (code.startsWith('C') || code.startsWith('R') || ['11', '12', '15', '26', '27'].includes(landuse || '')) {
    return '🏪';
  }
  
  // Office
  if (code.startsWith('O') || landuse === '13') {
    return '🏢';
  }
  
  // Industrial
  if (code.startsWith('F') || landuse === '18') {
    return '🏭';
  }
  
  // Vacant
  if (code.startsWith('V') || landuse === '29') {
    return '🌳';
  }
  
  // Hotel
  if (landuse === '07' || landuse === '16' || landuse === '31') {
    return '🏨';
  }
  
  // Institutional
  if (['20', '21', '22', '24'].includes(landuse || '')) {
    return '🏛️';
  }
  
  return '🏢';
}

// Helper function to format assessment value
export function formatAssessment(value?: number | null): string {
  if (!value || value <= 0) return 'N/A';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

// Helper function to format area
export function formatArea(sqft?: number | null): string {
  if (!sqft || sqft <= 0) return 'N/A';
  return `${sqft.toLocaleString()} sq ft`;
}
