import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  decimal,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// New GeoJSONData table to store large geojson data separately
export const geojsonData = pgTable('GeoJSONData', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  data: json('data').notNull(),
  metadata: json('metadata').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type GeoJSONData = InferSelectModel<typeof geojsonData>;

export const area = pgTable('Area', {
  chatId: uuid('chatId')
    .primaryKey()
    .notNull()
    .references(() => chat.id),
  name: varchar('name', { length: 255 }).notNull(),
  summary: text('summary').notNull(),
  geojsonDataId: uuid('geojsonDataId')
    .notNull()
    .references(() => geojsonData.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Area = InferSelectModel<typeof area>;

// NYC Neighborhoods table to store neighborhood data locally
export const nycNeighborhoods = pgTable('NYCNeighborhoods', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  borough: varchar('borough', { length: 100 }).notNull(),
  nta_code: varchar('nta_code', { length: 50 }).notNull(),
  nta_name: varchar('nta_name', { length: 255 }).notNull(),
  nta_2020: varchar('nta_2020', { length: 50 }).notNull(),
  cdtca: varchar('cdtca', { length: 50 }).notNull(),
  cdtca_name: varchar('cdtca_name', { length: 255 }).notNull(),
  center_latitude: decimal('center_latitude', {
    precision: 10,
    scale: 8,
  }).notNull(),
  center_longitude: decimal('center_longitude', {
    precision: 11,
    scale: 8,
  }).notNull(),
  shape_area: varchar('shape_area', { length: 50 }),
  shape_leng: varchar('shape_leng', { length: 50 }),
  geojsonDataId: uuid('geojsonDataId').references(() => geojsonData.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type NYCNeighborhood = InferSelectModel<typeof nycNeighborhoods>;

// PLUTO (Primary Land Use Tax Lot Output) table to store NYC tax lot data
export const plutoLots = pgTable('PlutoLots', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bbl: varchar('bbl', { length: 20 }).notNull().unique(), // Borough-Block-Lot
  borough: varchar('borough', { length: 50 }).notNull(),
  block: varchar('block', { length: 10 }).notNull(),
  lot: varchar('lot', { length: 10 }).notNull(),
  address: varchar('address', { length: 255 }),
  zipcode: varchar('zipcode', { length: 10 }),
  ownerName: text('ownerName'),
  ownerType: varchar('ownerType', { length: 100 }),
  landUse: varchar('landUse', { length: 100 }),
  landUseCode: varchar('landUseCode', { length: 10 }),
  buildingClass: varchar('buildingClass', { length: 100 }),
  buildingClassCode: varchar('buildingClassCode', { length: 10 }),
  yearBuilt: decimal('yearBuilt', { precision: 4, scale: 0 }),
  yearAltered: decimal('yearAltered', { precision: 4, scale: 0 }),
  numFloors: decimal('numFloors', { precision: 5, scale: 0 }),
  numStories: decimal('numStories', { precision: 5, scale: 0 }),
  lotArea: decimal('lotArea', { precision: 15, scale: 2 }),
  bldgArea: decimal('bldgArea', { precision: 15, scale: 2 }),
  commFAR: decimal('commFAR', { precision: 8, scale: 4 }),
  resFAR: decimal('resFAR', { precision: 8, scale: 4 }),
  facilFAR: decimal('facilFAR', { precision: 8, scale: 4 }),
  bldgFront: decimal('bldgFront', { precision: 10, scale: 2 }),
  bldgDepth: decimal('bldgDepth', { precision: 10, scale: 2 }),
  lotFront: decimal('lotFront', { precision: 10, scale: 2 }),
  lotDepth: decimal('lotDepth', { precision: 10, scale: 2 }),
  bldgClass: varchar('bldgClass', { length: 10 }),
  tract2010: varchar('tract2010', { length: 20 }),
  xCoord: decimal('xCoord', { precision: 12, scale: 2 }),
  yCoord: decimal('yCoord', { precision: 12, scale: 2 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  councilDistrict: varchar('councilDistrict', { length: 10 }),
  communityDistrict: varchar('communityDistrict', { length: 10 }),
  policePrecinct: varchar('policePrecinct', { length: 10 }),
  fireCompany: varchar('fireCompany', { length: 10 }),
  fireBattalion: varchar('fireBattalion', { length: 10 }),
  fireDivision: varchar('fireDivision', { length: 10 }),
  healthArea: varchar('healthArea', { length: 10 }),
  healthCenterDistrict: varchar('healthCenterDistrict', { length: 10 }),
  schoolDistrict: varchar('schoolDistrict', { length: 10 }),
  voterPrecinct: varchar('voterPrecinct', { length: 10 }),
  electionDistrict: varchar('electionDistrict', { length: 10 }),
  assemblyDistrict: varchar('assemblyDistrict', { length: 10 }),
  senateDistrict: varchar('senateDistrict', { length: 10 }),
  congressionalDistrict: varchar('congressionalDistrict', { length: 10 }),
  sanitationDistrict: varchar('sanitationDistrict', { length: 10 }),
  sanitationSub: varchar('sanitationSub', { length: 10 }),
  zoningDistrict: varchar('zoningDistrict', { length: 100 }),
  overlayDistrict1: varchar('overlayDistrict1', { length: 100 }),
  overlayDistrict2: varchar('overlayDistrict2', { length: 100 }),
  specialDistrict1: varchar('specialDistrict1', { length: 100 }),
  specialDistrict2: varchar('specialDistrict2', { length: 100 }),
  specialDistrict3: varchar('specialDistrict3', { length: 100 }),
  easements: varchar('easements', { length: 100 }),
  landmark: varchar('landmark', { length: 100 }),
  far: decimal('far', { precision: 8, scale: 4 }),
  irrLotCode: varchar('irrLotCode', { length: 10 }),
  lotType: varchar('lotType', { length: 10 }),
  bsmtCode: varchar('bsmtCode', { length: 10 }),
  assessLand: decimal('assessLand', { precision: 15, scale: 2 }),
  assessTot: decimal('assessTot', { precision: 15, scale: 2 }),
  exemptLand: decimal('exemptLand', { precision: 15, scale: 2 }),
  exemptTot: decimal('exemptTot', { precision: 15, scale: 2 }),
  yearAlter1: decimal('yearAlter1', { precision: 4, scale: 0 }),
  yearAlter2: decimal('yearAlter2', { precision: 4, scale: 0 }),
  histDist: varchar('histDist', { length: 100 }),
  lstAction: varchar('lstAction', { length: 100 }),
  lstStatus: varchar('lstStatus', { length: 100 }),
  lstDate: varchar('lstDate', { length: 20 }),
  lstReason: varchar('lstReason', { length: 100 }),
  geojsonDataId: uuid('geojsonDataId').references(() => geojsonData.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type PlutoLot = InferSelectModel<typeof plutoLots>;

// NYC Elementary School Zones table to store school district boundaries
export const nycSchoolZones = pgTable('NYCSchoolZones', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  dbn: varchar('dbn', { length: 50 }).notNull(), // District Borough Number (e.g., "20K503")
  schoolName: varchar('schoolName', { length: 255 }),
  schoolDistrict: varchar('schoolDistrict', { length: 10 }).notNull(),
  borough: varchar('borough', { length: 1 }).notNull(), // K, M, Q, X, R
  boroNum: varchar('boroNum', { length: 1 }).notNull(),
  label: varchar('label', { length: 100 }),
  initials: varchar('initials', { length: 10 }),
  zonedDist: varchar('zonedDist', { length: 10 }),
  esidNo: varchar('esidNo', { length: 20 }),
  shapeArea: varchar('shapeArea', { length: 50 }),
  shapeLength: varchar('shapeLength', { length: 50 }),
  xCentroid: decimal('xCentroid', { precision: 15, scale: 8 }),
  yCentroid: decimal('yCentroid', { precision: 15, scale: 8 }),
  remarks: text('remarks'),
  createDate: timestamp('createDate'),
  editDate: timestamp('editDate'),
  geojsonDataId: uuid('geojsonDataId').references(() => geojsonData.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type NYCSchoolZone = InferSelectModel<typeof nycSchoolZones>;

// NYC Parks table to store park boundaries and information
export const nycParks = pgTable('NYCParks', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  gispropnum: varchar('gispropnum', { length: 50 }), // GIS Property Number
  name: varchar('name', { length: 255 }), // Park name
  signname: varchar('signname', { length: 255 }), // Sign name
  borough: varchar('borough', { length: 50 }), // Borough name
  borocode: varchar('borocode', { length: 2 }), // Borough code (1-5)
  communityboard: varchar('communityboard', { length: 10 }), // Community board
  councildistrict: varchar('councildistrict', { length: 10 }), // Council district
  policepreinct: varchar('policepreinct', { length: 10 }), // Police precinct
  assemblydistrict: varchar('assemblydistrict', { length: 10 }), // Assembly district
  congressionaldistrict: varchar('congressionaldistrict', { length: 10 }), // Congressional district
  senateDistrict: varchar('senateDistrict', { length: 10 }), // Senate district
  zipcode: varchar('zipcode', { length: 20 }), // ZIP codes
  address: varchar('address', { length: 500 }), // Address
  acreage: varchar('acreage', { length: 20 }), // Park acreage
  typecategory: varchar('typecategory', { length: 100 }), // Type category
  landuse: varchar('landuse', { length: 100 }), // Land use
  department: varchar('department', { length: 100 }), // Managing department
  jurisdiction: varchar('jurisdiction', { length: 100 }), // Jurisdiction
  retired: varchar('retired', { length: 10 }), // Retired status
  waterfront: varchar('waterfront', { length: 10 }), // Waterfront designation
  geojsonDataId: uuid('geojsonDataId').references(() => geojsonData.id),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export type NYCPark = InferSelectModel<typeof nycParks>;

// NYC Census Blocks table to store census block boundaries and demographic data
export const nycCensusBlocks = pgTable('NYCCensusBlocks', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  geoid: varchar('geoid', { length: 15 }).notNull(), // Census Block GEOID (15 digit identifier)
  dataYear: integer('dataYear').notNull().default(2023), // Year of ACS data (2022, 2023, etc.)
  state: varchar('state', { length: 2 }).notNull(), // State FIPS code (36 for NY)
  county: varchar('county', { length: 3 }).notNull(), // County FIPS code (047 for Kings/Brooklyn)
  tract: varchar('tract', { length: 6 }).notNull(), // Census tract code
  block: varchar('block', { length: 4 }).notNull(), // Census block code
  // ACS 2023 Demographic Data
  totalPopulation: integer('totalPopulation'), // B25001_001E - Total population
  totalHouseholds: integer('totalHouseholds'), // B25002_001E - Total households
  occupiedHouseholds: integer('occupiedHouseholds'), // B25002_002E - Occupied households
  vacantHouseholds: integer('vacantHouseholds'), // B25002_003E - Vacant households
  medianHouseholdIncome: integer('medianHouseholdIncome'), // B19013_001E - Median household income
  totalHousingUnits: integer('totalHousingUnits'), // B25001_001E - Total housing units
  ownerOccupied: integer('ownerOccupied'), // B25003_002E - Owner occupied
  renterOccupied: integer('renterOccupied'), // B25003_003E - Renter occupied
  medianAge: decimal('medianAge', { precision: 5, scale: 2 }), // B01002_001E - Median age
  // Race/Ethnicity Data
  whiteAlone: integer('whiteAlone'), // B02001_002E - White alone
  blackAlone: integer('blackAlone'), // B02001_003E - Black or African American alone
  asianAlone: integer('asianAlone'), // B02001_005E - Asian alone
  hispanicLatino: integer('hispanicLatino'), // B03003_003E - Hispanic or Latino
  // Education Data
  bachelorsOrHigher: integer('bachelorsOrHigher'), // B15003_022E - Bachelor's degree or higher
  // Employment Data
  unemploymentRate: decimal('unemploymentRate', { precision: 5, scale: 2 }), // Calculated from B23025
  // Geographic identifiers
  borough: varchar('borough', { length: 50 }).notNull().default('Brooklyn'), // Always Brooklyn for our data
  geojsonDataId: uuid('geojsonDataId').references(() => geojsonData.id),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on geoid + dataYear to allow multiple years of data for same tract
  uniqueGeoidYear: unique().on(table.geoid, table.dataYear),
}));

export type NYCCensusBlock = InferSelectModel<typeof nycCensusBlocks>;

// GeoJSON types for area data
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][]; // Array of polygons
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPoint | GeoJSONPolygon | GeoJSONMultiPolygon;
  properties?: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type GeoJSON =
  | GeoJSONPoint
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONFeature
  | GeoJSONFeatureCollection;
