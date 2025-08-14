import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nycCensusBlocks, geojsonData } from '../lib/db/schema';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Sample census block data for Brooklyn
const sampleCensusBlocks = [
  {
    geoid: '360470001001000',
    state: '36',
    county: '047',
    tract: '000100',
    block: '1000',
    totalPopulation: 150,
    totalHouseholds: 65,
    occupiedHouseholds: 58,
    vacantHouseholds: 7,
    medianHouseholdIncome: 75000,
    totalHousingUnits: 65,
    ownerOccupied: 35,
    renterOccupied: 23,
    medianAge: '34.5',
    whiteAlone: 85,
    blackAlone: 35,
    asianAlone: 20,
    hispanicLatino: 15,
    bachelorsOrHigher: 45,
    unemploymentRate: '5.2',
    // Sample GeoJSON polygon for Williamsburg area
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.9567, 40.7081],
        [-73.9567, 40.7181], 
        [-73.9467, 40.7181],
        [-73.9467, 40.7081],
        [-73.9567, 40.7081]
      ]]
    }
  },
  {
    geoid: '360470001001001',
    state: '36',
    county: '047', 
    tract: '000100',
    block: '1001',
    totalPopulation: 240,
    totalHouseholds: 98,
    occupiedHouseholds: 91,
    vacantHouseholds: 7,
    medianHouseholdIncome: 85000,
    totalHousingUnits: 98,
    ownerOccupied: 52,
    renterOccupied: 39,
    medianAge: '29.8',
    whiteAlone: 120,
    blackAlone: 65,
    asianAlone: 35,
    hispanicLatino: 25,
    bachelorsOrHigher: 78,
    unemploymentRate: '4.1',
    // Sample GeoJSON polygon for DUMBO area
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.9895, 40.7033],
        [-73.9895, 40.7133],
        [-73.9795, 40.7133],
        [-73.9795, 40.7033],
        [-73.9895, 40.7033]
      ]]
    }
  },
  {
    geoid: '360470002001000',
    state: '36',
    county: '047',
    tract: '000200', 
    block: '1000',
    totalPopulation: 89,
    totalHouseholds: 42,
    occupiedHouseholds: 38,
    vacantHouseholds: 4,
    medianHouseholdIncome: 65000,
    totalHousingUnits: 42,
    ownerOccupied: 28,
    renterOccupied: 10,
    medianAge: '41.2',
    whiteAlone: 45,
    blackAlone: 25,
    asianAlone: 12,
    hispanicLatino: 8,
    bachelorsOrHigher: 32,
    unemploymentRate: '6.8',
    // Sample GeoJSON polygon for Park Slope area
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.9863, 40.6712],
        [-73.9863, 40.6812],
        [-73.9763, 40.6812],
        [-73.9763, 40.6712],
        [-73.9863, 40.6712]
      ]]
    }
  },
  {
    geoid: '360470003001000',
    state: '36',
    county: '047',
    tract: '000300',
    block: '1000', 
    totalPopulation: 312,
    totalHouseholds: 145,
    occupiedHouseholds: 138,
    vacantHouseholds: 7,
    medianHouseholdIncome: 125000,
    totalHousingUnits: 145,
    ownerOccupied: 95,
    renterOccupied: 43,
    medianAge: '36.7',
    whiteAlone: 185,
    blackAlone: 78,
    asianAlone: 32,
    hispanicLatino: 18,
    bachelorsOrHigher: 145,
    unemploymentRate: '2.8',
    // Sample GeoJSON polygon for Brooklyn Heights area
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.9956, 40.6955],
        [-73.9956, 40.7055],
        [-73.9856, 40.7055],
        [-73.9856, 40.6955],
        [-73.9956, 40.6955]
      ]]
    }
  },
  {
    geoid: '360470004001000',
    state: '36',
    county: '047',
    tract: '000400',
    block: '1000',
    totalPopulation: 198,
    totalHouseholds: 82,
    occupiedHouseholds: 76,
    vacantHouseholds: 6,
    medianHouseholdIncome: 45000,
    totalHousingUnits: 82,
    ownerOccupied: 25,
    renterOccupied: 51,
    medianAge: '27.3',
    whiteAlone: 65,
    blackAlone: 85,
    asianAlone: 28,
    hispanicLatino: 45,
    bachelorsOrHigher: 38,
    unemploymentRate: '8.5',
    // Sample GeoJSON polygon for Bedford-Stuyvesant area
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.9442, 40.6862],
        [-73.9442, 40.6962],
        [-73.9342, 40.6962],
        [-73.9342, 40.6862],
        [-73.9442, 40.6862]
      ]]
    }
  }
];

async function populateSampleCensusBlocks() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('🚀 Starting sample census blocks population...');
    
    // Clear existing census blocks data
    console.log('🧹 Clearing existing census blocks...');
    await db.delete(nycCensusBlocks);
    
    console.log(`📊 Processing ${sampleCensusBlocks.length} sample census blocks...`);
    
    let processedCount = 0;
    
    for (const blockData of sampleCensusBlocks) {
      try {
        // Insert GeoJSON data first
        const [geoRecord] = await db.insert(geojsonData).values({
          data: blockData.geometry,
          metadata: { source: 'Sample Data', year: '2023' }
        }).returning({ id: geojsonData.id });
        
        // Prepare census block data
        const censusBlockData = {
          geoid: blockData.geoid,
          state: blockData.state,
          county: blockData.county,
          tract: blockData.tract,
          block: blockData.block,
          totalPopulation: blockData.totalPopulation,
          totalHouseholds: blockData.totalHouseholds,
          occupiedHouseholds: blockData.occupiedHouseholds,
          vacantHouseholds: blockData.vacantHouseholds,
          medianHouseholdIncome: blockData.medianHouseholdIncome,
          totalHousingUnits: blockData.totalHousingUnits,
          ownerOccupied: blockData.ownerOccupied,
          renterOccupied: blockData.renterOccupied,
          medianAge: blockData.medianAge,
          whiteAlone: blockData.whiteAlone,
          blackAlone: blockData.blackAlone,
          asianAlone: blockData.asianAlone,
          hispanicLatino: blockData.hispanicLatino,
          bachelorsOrHigher: blockData.bachelorsOrHigher,
          unemploymentRate: blockData.unemploymentRate,
          borough: 'Brooklyn',
          geojsonDataId: geoRecord.id,
        };
        
        // Insert census block
        await db.insert(nycCensusBlocks).values(censusBlockData);
        processedCount++;
        
        console.log(`📈 Processed census block: ${blockData.geoid} (${processedCount}/${sampleCensusBlocks.length})`);
        
      } catch (error) {
        console.error(`❌ Error processing census block ${blockData.geoid}:`, error);
      }
    }
    
    console.log(`✅ Successfully populated ${processedCount} sample NYC census blocks`);
    
  } catch (error) {
    console.error('❌ Error populating sample census blocks:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the population script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSampleCensusBlocks()
    .then(() => {
      console.log('🎉 Sample census blocks population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Sample census blocks population failed:', error);
      process.exit(1);
    });
}