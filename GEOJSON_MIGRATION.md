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
- Added: `createGeoJSONData` and `updateGeoJSONData` functions

**AI Tools (`lib/ai/tools/update-area.ts`)**
- Updated to return `geojsonDataId` instead of full geojson data
- Maintains backward compatibility for tool responses

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

## Backward Compatibility

The implementation maintains backward compatibility:
- Existing code continues to work with the `geojson` field
- API responses still include geojson data when needed
- Frontend components work without changes

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

## Files Modified

- `lib/db/schema.ts` - Added GeoJSONData table
- `lib/db/queries.ts` - Updated area-related functions
- `lib/ai/tools/update-area.ts` - Updated tool responses
- `hooks/use-area.ts` - Updated interface
- `components/area-map.tsx` - Updated props interface
- `lib/db/migrations/0011_cold_puppet_master.sql` - Database migration
- `scripts/migrate-geojson.js` - Migration script (backup)
- `tests/tools/area-migration.test.ts` - Test coverage

## Testing

The implementation includes:
- Database migration tests
- Functionality tests for create/read/update operations
- Backward compatibility verification
- Integration tests with existing components 