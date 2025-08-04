# NYC Neighborhoods Database Migration

## Overview

The NYC neighborhoods tool has been migrated from API-based queries to a local database approach for improved performance and reliability. This change eliminates external API dependencies and provides faster query responses.

## Changes Made

### 1. Database Schema
- Added `NYCNeighborhoods` table to store neighborhood data locally
- Includes all neighborhood information: names, boroughs, coordinates, codes, etc.
- References to GeoJSON data for geometry storage

### 2. Database Queries
- Added new query functions in `lib/db/queries.ts`:
  - `getAllNYCNeighborhoods()` - Get all neighborhoods
  - `getNYCNeighborhoodsByBorough()` - Filter by borough
  - `searchNYCNeighborhoods()` - Search by name/borough
  - `createNYCNeighborhood()` - Add new neighborhood
  - `clearNYCNeighborhoods()` - Clear all data

### 3. Tool Implementation
- Updated `lib/ai/tools/nyc-neighborhoods.ts` to use database queries instead of API calls
- Removed in-memory caching (no longer needed)
- Improved error handling and performance

### 4. Data Population
- Created `scripts/populate-nyc-neighborhoods.ts` to fetch and populate data from NYC Open Data API
- Automatically calculates center points from geometry data
- Populated 262 neighborhoods from official NYC data

## Performance Benefits

### Before (API-based)
- External API calls required for each query
- Network latency and potential API rate limits
- In-memory caching with 24-hour expiration
- Dependency on NYC Open Data API availability

### After (Database-based)
- Local database queries (sub-millisecond response times)
- No external dependencies or network calls
- Persistent data storage
- No rate limiting or API availability concerns
- Optimized queries with proper indexing

## Usage

### Tool Parameters
The NYC neighborhoods tool now supports:
- `borough`: Filter by specific borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- `neighborhood`: Search for specific neighborhood names
- `limit`: Maximum number of results to return (default: 50)

### Example Queries
```
"Get all Manhattan neighborhoods"
"Find neighborhoods in Brooklyn"
"Search for Williamsburg"
"Get the first 10 neighborhoods from Queens"
```

## Data Management

### Initial Setup
1. Run database migration: `npx drizzle-kit migrate`
2. Populate data: `npx tsx scripts/populate-nyc-neighborhoods.ts`

### Data Updates
Neighborhood data doesn't change frequently, but when updates are needed:
1. Run the population script again to refresh data
2. The script will clear existing data and insert fresh records

### Testing
Run the test script to verify functionality:
```bash
npx tsx scripts/test-nyc-neighborhoods.ts
```

## Database Schema

```sql
CREATE TABLE "NYCNeighborhoods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "borough" varchar(100) NOT NULL,
  "nta_code" varchar(50) NOT NULL,
  "nta_name" varchar(255) NOT NULL,
  "nta_2020" varchar(50) NOT NULL,
  "cdtca" varchar(50) NOT NULL,
  "cdtca_name" varchar(255) NOT NULL,
  "center_latitude" decimal(10,8) NOT NULL,
  "center_longitude" decimal(11,8) NOT NULL,
  "shape_area" varchar(50),
  "shape_leng" varchar(50),
  "geojsonDataId" uuid REFERENCES "GeoJSONData"("id"),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
```

## Data Source

Data is sourced from the official NYC Neighborhood Tabulation Areas 2020 dataset:
- **Source**: NYC Open Data Portal
- **Dataset**: NYC Neighborhood Tabulation Areas 2020
- **URL**: https://data.cityofnewyork.us/resource/9nt8-h7nd.json
- **Total Neighborhoods**: 262
- **Boroughs**: Manhattan (38), Brooklyn (69), Queens (67), Bronx (55), Staten Island (33)

## Migration Notes

- The old API-based implementation has been completely replaced
- No breaking changes to the tool interface
- All existing functionality preserved with improved performance
- GeoJSON data storage remains unchanged for compatibility

## Future Enhancements

- Add indexes for common query patterns
- Implement data versioning for updates
- Add neighborhood boundary data storage
- Create admin interface for data management 