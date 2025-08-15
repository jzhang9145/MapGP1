# Migration Guide: Database to API-Only Queries

This guide explains how to migrate from local database storage to direct API queries for NYC data.

## ✅ Completed: MapPLUTO Tool

The MapPLUTO tool has been updated to use direct API calls:

### Changes Made:
- **Removed**: `getAllMapPLUTO` database dependency
- **Added**: `fetchMapPLUTOFromAPI()` function that queries NYC Open Data directly
- **Added**: `fetchGeometryFromArcGIS()` for boundary data when needed
- **Benefits**: No local storage required, always up-to-date data

### API Endpoints Used:
- **Property Data**: `https://data.cityofnewyork.us/resource/64uk-42ks.json`
- **Geometry Data**: ArcGIS REST API `https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query`

## 🔄 TODO: Other Tools Requiring Migration

### 1. Spatial Analysis Tool (`lib/ai/tools/spatial-analysis.ts`)
**Current Database Dependencies:**
- `searchNYCNeighborhoods()`
- `getNYCParksWithGeoJSON()`
- `getNYCSchoolZonesWithGeoJSON()`
- `getNYCCensusBlocksWithGeoJSON()`
- `getGeoJSONDataById()`

**Required API Endpoints:**
- **NYC Parks**: `https://data.cityofnewyork.us/resource/enfh-gkve.json`
- **School Zones**: Various NYC DOE APIs
- **Census Blocks**: US Census API
- **Neighborhoods**: Community Districts API

### 2. NYC Parks Tool (`lib/ai/tools/nyc-parks.ts`)
**Current**: Uses `getAllNYCParks()` from database
**Migration**: Direct to NYC Parks API
**API**: `https://data.cityofnewyork.us/resource/enfh-gkve.json`

### 3. NYC School Zones Tool (`lib/ai/tools/nyc-school-zones.ts`)
**Current**: Uses `getAllNYCSchoolZones()` from database
**Migration**: Direct to NYC Department of Education APIs
**APIs**: Multiple school zone APIs

### 4. NYC Census Tool (`lib/ai/tools/nyc-census.ts`)
**Current**: Uses local census database
**Migration**: Direct to US Census API
**API**: `https://api.census.gov/data/2022/acs/acs5`

### 5. NYC Neighborhoods Tool (`lib/ai/tools/nyc-neighborhoods.ts`)
**Current**: Uses `searchNYCNeighborhoods()` from database
**Migration**: Community Districts API or GeoJSON files

## 🔧 Implementation Steps

### Step 1: Update Each Tool
For each tool, follow this pattern:

```typescript
// Replace database imports
// import { getAllXXX } from '@/lib/db/queries';

// Add API fetch function
async function fetchXXXFromAPI(filters: any) {
  const response = await fetch('API_ENDPOINT?' + params);
  const data = await response.json();
  return transformData(data);
}

// Update tool execute function
execute: async (params) => {
  const results = await fetchXXXFromAPI(params);
  // Process results...
}
```

### Step 2: Handle Geometry Data
When spatial analysis is needed:

```typescript
// For boundary queries, use NYC's geometry APIs
async function fetchGeometryFromNYC(type: string, identifier: string) {
  // Use appropriate geometry API based on type
  if (type === 'neighborhood') {
    // Use Community Districts API
  } else if (type === 'park') {
    // Use Parks GeoJSON API
  }
  // etc.
}
```

### Step 3: Remove Database Dependencies
After migration:
1. Remove unused database query functions from `lib/db/queries.ts`
2. Remove unused database tables from schema
3. Update imports in components
4. Remove population scripts

## 📋 Benefits of API-Only Approach

### ✅ Advantages:
- **Always Current**: Data is always up-to-date
- **No Storage**: No local database maintenance
- **Simpler Deployment**: No database setup required
- **Official Sources**: Direct from authoritative APIs

### ⚠️ Considerations:
- **Rate Limits**: Need to handle API rate limiting
- **Performance**: May be slower than local queries
- **Reliability**: Dependent on external API availability
- **Caching**: May want to implement response caching

## 🚀 Quick Start: Test Updated MapPLUTO

The MapPLUTO tool is ready to test:

```typescript
// In your chat, try:
"Find commercial properties over $10M assessment"
"Show me vacant lots in Brooklyn"
"Properties built after 2010"
```

## 📞 API Rate Limits & Best Practices

### NYC Open Data (Socrata)
- **Default Limit**: 1000 requests/rolling hour
- **With App Token**: 10,000 requests/rolling hour
- **Best Practice**: Use SoQL filters to reduce data transfer

### Census API
- **Rate Limit**: 500 queries per IP address per day
- **Best Practice**: Cache responses for repeated queries

### NYC ArcGIS
- **Rate Limit**: Varies by service
- **Best Practice**: Use geometry queries sparingly

## 🔄 Rollback Plan

If issues arise, the database approach can be restored by:
1. Reverting the MapPLUTO tool changes
2. Re-importing database query functions
3. Ensuring database is populated with recent data

---

This migration provides maximum flexibility while reducing infrastructure dependencies. Each tool can be migrated independently for a gradual transition.
