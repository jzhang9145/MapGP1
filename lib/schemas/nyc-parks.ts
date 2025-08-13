import { z } from 'zod';

// Schema for individual park data
export const parkSchema = z.object({
  id: z.string(),
  gispropnum: z.string().optional().describe('GIS Property Number'),
  name: z.string().optional().describe('Park name'),
  signname: z.string().optional().describe('Sign name displayed at park'),
  borough: z.string().optional().describe('Borough where park is located'),
  borocode: z.string().optional().describe('Borough code (1-5)'),
  communityboard: z.string().optional().describe('Community board'),
  councildistrict: z.string().optional().describe('Council district'),
  policepreinct: z.string().optional().describe('Police precinct'),
  assemblydistrict: z.string().optional().describe('Assembly district'),
  congressionaldistrict: z.string().optional().describe('Congressional district'),
  senateDistrict: z.string().optional().describe('Senate district'),
  zipcode: z.string().optional().describe('ZIP codes'),
  address: z.string().optional().describe('Park address'),
  acreage: z.string().optional().describe('Park acreage'),
  typecategory: z.string().optional().describe('Type category of the park'),
  landuse: z.string().optional().describe('Land use designation'),
  department: z.string().optional().describe('Managing department'),
  jurisdiction: z.string().optional().describe('Jurisdiction'),
  retired: z.string().optional().describe('Whether park is retired'),
  waterfront: z.string().optional().describe('Waterfront designation'),
  geojsonDataId: z.string().optional().describe('Associated GeoJSON data ID'),
  geojson: z.any().optional().describe('GeoJSON boundary data for the park'),
  createdAt: z.string().optional().describe('Creation timestamp'),
  updatedAt: z.string().optional().describe('Last update timestamp'),
});

export type Park = z.infer<typeof parkSchema>;

// Schema for parks tool response
export const parksResponseSchema = z.object({
  parks: z.array(parkSchema),
  totalCount: z.number().describe('Total number of parks found'),
  searchTerm: z.string().optional().describe('Search term used'),
  borough: z.string().optional().describe('Borough filter applied'),
  message: z.string().describe('Summary message about the parks found'),
});

export type ParksResponse = z.infer<typeof parksResponseSchema>;

// Helper function to format park information
export function formatParkInfo(park: Park): string {
  const parts = [];
  
  if (park.name) {
    parts.push(`**${park.name}**`);
  }
  
  if (park.signname && park.signname !== park.name) {
    parts.push(`(Sign Name: ${park.signname})`);
  }
  
  if (park.borough) {
    parts.push(`Borough: ${park.borough}`);
  }
  
  if (park.address) {
    parts.push(`Address: ${park.address}`);
  }
  
  if (park.acreage) {
    parts.push(`Size: ${park.acreage} acres`);
  }
  
  if (park.typecategory) {
    parts.push(`Type: ${park.typecategory}`);
  }
  
  if (park.department) {
    parts.push(`Managed by: ${park.department}`);
  }
  
  if (park.waterfront === 'Y' || park.waterfront === 'Yes') {
    parts.push('🌊 Waterfront Location');
  }
  
  return parts.join('\n');
}

// Helper function to get borough display name
export function getBoroughDisplayName(borough: string): string {
  const boroughMap: Record<string, string> = {
    '1': 'Manhattan',
    '2': 'Bronx', 
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
    'M': 'Manhattan',
    'X': 'Bronx',
    'K': 'Brooklyn', 
    'Q': 'Queens',
    'R': 'Staten Island',
    'Manhattan': 'Manhattan',
    'Bronx': 'Bronx',
    'Brooklyn': 'Brooklyn', 
    'Queens': 'Queens',
    'Staten Island': 'Staten Island',
  };
  
  return boroughMap[borough] || borough;
}