# NYC Neighborhoods Tool

## Overview
The `nycNeighborhoods` tool allows the AI agent to fetch NYC neighborhood data from the NY Open Data portal. It uses the official NYC Neighborhood Tabulation Areas 2020 dataset to provide complete polygon boundaries for each neighborhood. This provides accurate neighborhood boundaries for mapping and area calculations.

## Features

### ✅ **Data Sources**
- **NY Open Data Portal**: Official NYC government data
- **NYC Neighborhood Tabulation Areas 2020**: Official neighborhood boundaries with polygon data
- **Complete Polygons**: Full polygon boundaries for accurate mapping
- **Official NTA Codes**: Standardized neighborhood identification codes

### 🔧 **Key Capabilities**
- **Borough Filtering**: Filter by specific borough or get all NYC
- **Multiple Formats**: Full GeoJSON or summary information
- **Configurable Limits**: Control the number of neighborhoods returned
- **Real-time Data**: Direct access to NY Open Data API
- **Complete Polygons**: Full polygon boundaries for accurate mapping
- **Official Boundaries**: Uses official NYC Neighborhood Tabulation Areas

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
  "dataset": "NYC Neighborhood Tabulation Areas 2020",
  "borough": "All",
  "totalFeatures": 195,
  "dataType": "Official polygon boundaries from NYC Neighborhood Tabulation Areas",
  "note": "This dataset contains official NYC Neighborhood Tabulation Areas with complete polygon boundaries for accurate mapping and area calculations.",
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "summary": {
    "neighborhoods": ["Greenpoint", "Williamsburg", ...],
    "boroughs": ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  }
}
```

### Summary Format Response
```json
{
  "success": true,
  "source": "NY Open Data",
  "dataset": "NYC Neighborhood Tabulation Areas 2020",
  "borough": "Manhattan",
  "totalNeighborhoods": 12,
  "dataType": "Official polygon boundaries from NYC Neighborhood Tabulation Areas",
  "note": "This dataset contains official NYC Neighborhood Tabulation Areas with complete polygon boundaries for accurate mapping and area calculations.",
  "boroughCounts": {
    "Manhattan": 12
  },
  "neighborhoods": [
    {
      "name": "Upper East Side",
      "borough": "Manhattan",
      "nta_code": "MN31",
      "nta_2020": "MN31",
      "cdtca": "108",
      "cdtca_name": "Manhattan Community District 8",
      "center": {
        "latitude": 40.7629,
        "longitude": -73.9654
      },
      "hasPolygon": true,
      "shape_area": "35321809.1041",
      "shape_leng": "28919.5608108"
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

### Official NYC Neighborhood Boundaries
- **Official NYC neighborhoods** as defined by the city
- **Complete polygon boundaries** for accurate mapping
- **Official NTA codes** and community district information
- **Official names** and standardized identifiers
- **Shape area and length** data for each neighborhood
- **Note**: Uses official NYC Neighborhood Tabulation Areas 2020 boundaries

### Data Fields
- `name`: Neighborhood name
- `borough`: Borough name
- `nta_code`: Neighborhood Tabulation Area code
- `nta_2020`: NTA code for 2020 boundaries
- `cdtca`: Community District Tabulation Area code
- `cdtca_name`: Community District name
- `center`: Calculated center point from polygon
- `geometry`: GeoJSON polygon geometry for mapping
- `shape_area`: Area of the neighborhood polygon
- `shape_leng`: Length of the neighborhood polygon boundary

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
- **Neighborhood Names**: xyye-rtrs
- **NYC Trees Dataset**: uvpi-gqnh (for tree locations)
- **NYC Neighborhood Tabulation Areas 2020**: 9nt8-h7nd (official boundaries)

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