// Test script to demonstrate PLUTO area-based queries
// This script shows how to use the PLUTO tool with area-based queries

console.log('PLUTO Area-Based Query Examples:');
console.log('================================');

// Example 1: Get PLUTO data for a specific area (chat ID)
console.log('\n1. Get PLUTO data for currently selected area:');
console.log('pluto({ areaId: "chat-123", limit: 100 })');
console.log('   - Returns all PLUTO lots within the area defined in chat-123');
console.log("   - Uses the area's GeoJSON geometry to filter lots");
console.log('   - Limit: 100 lots maximum');

// Example 2: Combine area query with filters
console.log('\n2. Get PLUTO data for area with additional filters:');
console.log('pluto({ areaId: "chat-123", landUse: "Commercial", limit: 50 })');
console.log('   - Returns commercial lots within the specified area');
console.log('   - Combines spatial and attribute filtering');

// Example 3: Get large lots in an area
console.log('\n3. Get large lots in an area:');
console.log('pluto({ areaId: "chat-123", lotAreaMin: 10000, limit: 25 })');
console.log(
  '   - Returns lots with area >= 10,000 sq ft within the specified area',
);

// Example 4: Get old buildings in an area
console.log('\n4. Get old buildings in an area:');
console.log('pluto({ areaId: "chat-123", yearBuiltMax: 1900, limit: 30 })');
console.log(
  '   - Returns buildings built before 1900 within the specified area',
);

// Example 5: Get specific zoning in an area
console.log('\n5. Get specific zoning in an area:');
console.log('pluto({ areaId: "chat-123", zoningDistrict: "R6", limit: 40 })');
console.log('   - Returns R6 zoned lots within the specified area');

console.log('\nUsage in Chat:');
console.log('==============');
console.log('1. First, use the updateArea tool to define a geographic area');
console.log(
  '2. Then use pluto({ areaId: "current-chat-id" }) to get lots in that area',
);
console.log('3. You can combine with other filters for more specific results');

console.log(
  '\nNote: The areaId should be the chat ID where the area was defined.',
);
console.log(
  "The tool will automatically use the area's geometry to filter PLUTO lots.",
);
