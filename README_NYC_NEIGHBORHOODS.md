# NYC Neighborhoods Tool

## Overview
The `nycNeighborhoods` tool allows the AI agent to fetch NYC neighborhood data from the NY Open Data portal. It uses the NYC Trees dataset to calculate neighborhood centers by averaging the locations of all trees within each neighborhood. Note: This approach provides calculated centers rather than full polygon boundaries.

## Features

### ✅ **Data Sources**
- **NY Open Data Portal**: Official NYC government data
- **NYC Trees Dataset**: Individual tree locations within neighborhoods
- **Calculated Centers**: Neighborhood centers calculated from tree location averages
- **Tree Count Data**: Number of trees per neighborhood for context

### 🔧 **Key Capabilities**
- **Borough Filtering**: Filter by specific borough or get all NYC
- **Multiple Formats**: Full GeoJSON or summary information
- **Configurable Limits**: Control the number of neighborhoods returned
- **Real-time Data**: Direct access to NY Open Data API
- **Calculated Centers**: Neighborhood centers calculated from tree location averages
- **Tree Count Information**: Shows number of trees used for center calculation

## Usage Examples

### Get All NYC Neighborhoods
```
"Can you get all NYC neighborhoods?"
```

### Get Manhattan Neighborhoods
```
"Show me the neighborhoods in Manhattan"
```

### Get Summary Information
```
"Give me a summary of Brooklyn neighborhoods"
```

### Get Specific Number of Neighborhoods
```
"Get the first 20 neighborhoods from Queens"
```

## Tool Parameters

### Required Parameters
None (all parameters are optional with defaults)

### Optional Parameters
- `borough` (string): Specific borough to fetch
  - Options: 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'All'
  - Default: 'All'
- `format` (string): Return format
  - Options: 'geojson', 'summary'
  - Default: 'geojson'
- `limit` (number): Maximum number of neighborhoods to return
  - Default: 50

## Response Structure

### GeoJSON Format Response
```json
{
  "success": true,
  "source": "NY Open Data",
  "dataset": "NYC Trees Dataset (Calculated Centers)",
  "borough": "All",
  "totalFeatures": 124,
  "dataType": "Calculated centers from tree locations",
  "note": "This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. For full polygon boundaries, a different dataset would be needed.",
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "summary": {
    "neighborhoods": ["Forest Hills", "Astoria", ...],
    "boroughs": ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  }
}
```

### Summary Format Response
```json
{
  "success": true,
  "source": "NY Open Data",
  "dataset": "NYC Trees Dataset (Calculated Centers)",
  "borough": "Manhattan",
  "totalNeighborhoods": 12,
  "dataType": "Calculated centers from tree locations",
  "note": "This dataset contains individual tree locations. Neighborhood centers are calculated as averages of all tree locations within each neighborhood. For full polygon boundaries, a different dataset would be needed.",
  "boroughCounts": {
    "Manhattan": 12
  },
  "neighborhoods": [
    {
      "name": "Upper East Side",
      "borough": "Manhattan",
      "nta_code": "MN31",
      "treeCount": 45,
      "latitude": 40.7629,
      "longitude": -73.9654
    }
  ]
}
```

## UI Feedback

### Loading State
- **Color**: Blue theme
- **Message**: "Fetching NYC neighborhoods..."
- **Additional Info**: Shows borough and format if specified

### Success State
- **Color**: Blue success box
- **Information Displayed**:
  - Data source and dataset
  - Borough information
  - Total counts and statistics
  - Sample neighborhood names
  - Borough breakdowns

### Error State
- **Color**: Red error message
- **Details**: Specific error information

## NYC Boroughs

### Available Boroughs
1. **Manhattan**: 12 Community Districts
2. **Brooklyn**: 18 Community Districts
3. **Queens**: 14 Community Districts
4. **Bronx**: 12 Community Districts
5. **Staten Island**: 3 Community Districts

### Total: 59 Community Districts across NYC

## Data Details

### Calculated Neighborhood Centers
- **Official NYC neighborhoods** as defined by the city
- **Calculated centers** based on tree location averages
- **Tree count data** for each neighborhood
- **Official names** and NTA codes
- **Note**: Centers are calculated from tree locations, not official boundaries

### Data Fields
- `name`: Neighborhood name
- `borough`: Borough name
- `nta_code`: Neighborhood Tabulation Area code
- `zipcode`: ZIP code (when available)
- `zip_city`: City name for ZIP code (when available)
- `latitude`: Calculated center latitude (average of tree locations)
- `longitude`: Calculated center longitude (average of tree locations)
- `treeCount`: Number of trees used to calculate the center
- `geometry`: GeoJSON geometry for mapping (Point)

## Examples

### Example 1: All NYC Neighborhoods
```
User: "Get all NYC neighborhoods"
AI: [Uses nycNeighborhoods tool to fetch all 59 community districts]
```

### Example 2: Manhattan Only
```
User: "Show me Manhattan neighborhoods"
AI: [Uses nycNeighborhoods tool with borough: 'Manhattan']
```

### Example 3: Summary Format
```
User: "Give me a summary of Brooklyn neighborhoods"
AI: [Uses nycNeighborhoods tool with borough: 'Brooklyn', format: 'summary']
```

### Example 4: Limited Results
```
User: "Get the first 10 neighborhoods from Queens"
AI: [Uses nycNeighborhoods tool with borough: 'Queens', limit: 10]
```

## Integration with Maps

The GeoJSON data returned by this tool can be directly used with:
- **Leaflet maps** (already integrated in your app)
- **Mapbox** or other mapping services
- **GIS applications**
- **Data visualization tools**

## Error Scenarios

### Common Issues
1. **API Unavailable**: NY Open Data portal temporarily down
2. **Network Errors**: Connection issues
3. **Invalid Borough**: Borough name not recognized
4. **Rate Limiting**: Too many requests

### Error Messages
- "Failed to fetch NYC neighborhood data"
- "NY Open Data API error: XXX"
- "Network connection error"

## Data Source

### NY Open Data Portal
- **URL**: https://data.cityofnewyork.us/
- **Dataset**: Community Districts (uvpi-gqnh)
- **License**: Open data, free to use
- **Update Frequency**: Regular updates from NYC government

### Alternative Datasets
- **NTA (Neighborhood Tabulation Areas)**: cpf4-rkhq
- **Neighborhood Names**: xyye-rtrs

## Use Cases

### Perfect For
- **Mapping applications** requiring NYC neighborhood boundaries
- **Data analysis** of NYC neighborhoods
- **Real estate applications** with neighborhood data
- **Urban planning** and demographic studies
- **Tourism applications** with neighborhood information

### Integration Examples
- Display neighborhoods on a map
- Filter data by neighborhood
- Show neighborhood statistics
- Create neighborhood-based visualizations 