# GeoJSON Data Separation Migration

## Overview

This document describes the migration of GeoJSON data from being stored directly in the `Area` table to a separate `GeoJSONData` table. This change was implemented to reduce the size of data sent to AI LLMs in prompts, improving performance and reducing context usage.

## Changes Made

### 1. Database Schema Changes

**New Table: `GeoJSONData`**
- `id` (UUID, Primary Key)
- `data` (JSON) - The actual GeoJSON data
- `metadata` (JSON) - Additional information like type, size, etc.
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

**Modified Table: `Area`**
- Removed: `geojson` (JSON) field
- Added: `geojsonDataId` (UUID, Foreign Key to GeoJSONData.id)

### 2. Database Migration

Created migration `0011_cold_puppet_master.sql` that:
1. Creates the new `GeoJSONData` table
2. Adds `geojsonDataId` column to `Area` table (initially nullable)
3. Migrates existing GeoJSON data to the new table
4. Makes `geojsonDataId` NOT NULL
5. Removes the old `geojson` column

### 3. Updated Functions

**Database Queries (`lib/db/queries.ts`)**
- `getAreaByChatId`: Now joins with GeoJSONData table
- `createArea`: Creates GeoJSONData record first, then Area record
- `updateArea`: Updates GeoJSONData if geojson is provided
- Added: `createGeoJSONData`, `updateGeoJSONData`, and `getGeoJSONDataById` functions

**AI Tools (`lib/ai/tools/update-area.ts`)**
- Updated to return `geojsonDataId` instead of full geojson data
- Updated tool description to reflect the new reference-based approach
- Maintains backward compatibility for tool responses

**AI Tools (`lib/ai/tools/nyc-neighborhoods.ts`)**
- **Major Optimization**: Now stores geometry data in `GeoJSONData` table instead of memory
- Uses `geojsonDataId` references instead of storing geometry directly
- Added new `reference` format option that provides metadata without full geojson data
- Updated tool description to reflect the optimization
- **Added comprehensive TypeScript type definitions** for all response formats
- **Added comprehensive Zod schemas** for runtime validation of all response formats
- **Moved schemas to shared location** (`lib/schemas/nyc-neighborhoods.ts`) for UI usage
- Optimized for use with the updateArea tool

### 4. Frontend Updates

**Hooks (`hooks/use-area.ts`)**
- Updated Area interface to include optional `geojsonDataId`
- Maintains backward compatibility with existing `geojson` field

**Components (`components/area-map.tsx`)**
- Updated AreaMapProps interface to include `geojsonDataId`
- No functional changes needed as geojson data is still available

### 5. API Routes

The API routes (`app/(chat)/api/chat/[id]/area/route.ts`) automatically work with the new schema since they use the updated database functions.

## Benefits

1. **Reduced AI Context Size**: GeoJSON data is no longer included in prompts, only references
2. **Better Performance**: Smaller database queries and API responses
3. **Improved Scalability**: GeoJSON data can be cached separately
4. **Cleaner Architecture**: Separation of concerns between area metadata and geographic data
5. **Optimized AI Tools**: Tools now return references instead of large geojson data
6. **Memory Optimization**: NYC neighborhoods tool no longer stores large geometry data in memory

## Backward Compatibility

The implementation maintains backward compatibility:
- Existing code continues to work with the `geojson` field
- API responses still include geojson data when needed
- Frontend components work without changes
- All existing functionality preserved

## Migration Process

1. **Database Migration**: Applied automatically via Drizzle
2. **Data Migration**: Existing GeoJSON data is automatically migrated to the new table
3. **Code Updates**: All relevant functions and components updated
4. **Testing**: Verified that existing functionality continues to work

## Usage

### Creating an Area
```typescript
const newArea = await createArea({
  chatId: 'chat-id',
  name: 'My Area',
  summary: 'Description',
  geojson: { /* GeoJSON data */ }
});
```

### Retrieving an Area
```typescript
const area = await getAreaByChatId({ chatId: 'chat-id' });
// area.geojson contains the full GeoJSON data
// area.geojsonDataId contains the reference ID
```

### Updating an Area
```typescript
const updatedArea = await updateArea({
  chatId: 'chat-id',
  name: 'Updated Name',
  summary: 'Updated Description',
  geojson: { /* new GeoJSON data */ }
});
```

### Using NYC Neighborhoods Tool
```typescript
// Get full geojson data (simplified to points, geometry stored separately)
const fullData = await nycNeighborhoods({
  borough: 'Manhattan',
  format: 'geojson'
});

// Get summary only (small)
const summary = await nycNeighborhoods({
  borough: 'Manhattan',
  format: 'summary'
});

// Get reference format (optimized - only geojsonDataId references)
const reference = await nycNeighborhoods({
  borough: 'Manhattan',
  format: 'reference'
});
```

### Schema Validation
The NYC neighborhoods tool includes comprehensive Zod schemas for runtime validation:

```typescript
import {
  nycNeighborhoodsErrorSchema,
  nycNeighborhoodsSummarySchema,
  nycNeighborhoodsReferenceSchema,
  nycNeighborhoodsGeoJSONSchema,
  nycNeighborhoodsResponseSchema,
} from '@/lib/schemas/nyc-neighborhoods';

// Validate any response format
const result = nycNeighborhoodsResponseSchema.safeParse(response);
if (result.success) {
  // Response is valid
  console.log(result.data);
} else {
  // Handle validation errors
  console.error(result.error);
}
```

### UI Component Usage
The schemas can be used in UI components for type-safe data handling:

```typescript
import { NYCNeighborhoodsDisplay } from '@/components/nyc-neighborhoods-display';
import { nycNeighborhoodsResponseSchema } from '@/lib/schemas/nyc-neighborhoods';

// In your component
const handleNeighborhoodData = (data: unknown) => {
  const validationResult = nycNeighborhoodsResponseSchema.safeParse(data);
  if (validationResult.success) {
    // Use the validated data
    setNeighborhoods(validationResult.data);
  }
};

// Render the component
<NYCNeighborhoodsDisplay 
  initialData={validatedData}
  onNeighborhoodSelect={handleNeighborhoodSelect}
/>
```

### Retrieving Full Geometry Data
```typescript
// Get full geometry data by ID
const geometryData = await getGeoJSONDataById({ id: 'geojson-data-id' });
// geometryData.data contains the full GeoJSON geometry
```

## Files Modified

- `lib/db/schema.ts` - Added GeoJSONData table
- `lib/db/queries.ts` - Updated area-related functions and added getGeoJSONDataById
- `lib/ai/tools/update-area.ts` - Updated tool responses and descriptions
- `lib/ai/tools/nyc-neighborhoods.ts` - **Major optimization**: Uses geojsonDataId instead of geometry
- `hooks/use-area.ts` - Updated interface
- `components/area-map.tsx` - Updated props interface
- `lib/db/migrations/0011_cold_puppet_master.sql` - Database migration
- `scripts/migrate-geojson.js` - Migration script (backup)
- `tests/tools/area-migration.test.ts` - Test coverage
- `tests/tools/geojson-optimization.test.ts` - Updated tests for new structure

## Testing

The implementation includes:
- Database migration tests
- Functionality tests for create/read/update operations
- Backward compatibility verification
- Integration tests with existing components
- Tests for the new geojsonDataId-based structure 