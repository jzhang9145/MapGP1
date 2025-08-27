import { useState, useEffect } from 'react';

// Function to fetch GeoJSON data by ID
async function fetchGeoJSONData(geojsonDataId: string) {
  try {
    const response = await fetch(`/api/geojson/${geojsonDataId}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch GeoJSON data for ID ${geojsonDataId}:`,
        response.status,
      );
      return null;
    }
    const data = await response.json();
    return data.geojson;
  } catch (error) {
    console.error(
      `Error fetching GeoJSON data for ID ${geojsonDataId}:`,
      error,
    );
    return null;
  }
}

// Hook to manage spatial analysis results from chat messages
export function useSpatialAnalysisFromMessages(
  messages: any[],
  chatId: string,
) {
  const [spatialResults, setSpatialResults] = useState<any[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const processResults = async () => {
      const latestResults: any[] = [];

      // Look for spatial analysis tool results in the messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.parts) {
          for (const part of message.parts) {
            if (
              part.type === 'tool-spatialAnalysis' &&
              'output' in part &&
              part.state === 'output-available' &&
              !('error' in part.output) &&
              part.output?.results
            ) {
              // Process results with GeoJSON data or geojsonDataId
              for (const result of part.output.results) {
                if (result.geojson && Object.keys(result.geojson).length > 0) {
                  // Legacy: direct GeoJSON data
                  const {
                    crs: _omitCrs,
                    properties: _omitProps,
                    ...cleaned
                  } = result.geojson;
                  latestResults.push({
                    ...result,
                    geojson: cleaned,
                    layerType: part.output.primaryLayer,
                    analysisQuery: part.output.query,
                    spatialRelation: part.output.spatialRelation,
                    filterDescription: part.output.filterDescription,
                  });
                } else if (result.geojsonDataId) {
                  // New: fetch GeoJSON data by ID
                  try {
                    const geojsonData = await fetchGeoJSONData(
                      result.geojsonDataId,
                    );
                    if (geojsonData) {
                      // Handle different GeoJSON structures
                      let finalGeojson = geojsonData;

                      // If it's a FeatureCollection (like properties), find the matching feature
                      if (
                        geojsonData.type === 'FeatureCollection' &&
                        result.layerType === 'properties'
                      ) {
                        // For properties, find the feature that matches this result's BBL or OBJECTID
                        const matchingFeature = geojsonData.features.find(
                          (feature: any) => {
                            const props = feature.properties || {};
                            return (
                              props.BBL === result.bbl ||
                              props.OBJECTID === result.id ||
                              props.Address === result.address
                            );
                          },
                        );

                        if (matchingFeature) {
                          finalGeojson = matchingFeature;
                        } else {
                          // Use the whole FeatureCollection as fallback
                          finalGeojson = geojsonData;
                        }
                      }

                      // Sanitize ArcGIS FeatureCollection extras that may confuse the renderer
                      const {
                        crs: _omitCrs,
                        properties: _omitProps,
                        ...cleaned
                      } = finalGeojson;
                      latestResults.push({
                        ...result,
                        geojson: cleaned,
                        layerType: part.output.primaryLayer,
                        analysisQuery: part.output.query,
                        spatialRelation: part.output.spatialRelation,
                        filterDescription: part.output.filterDescription,
                      });
                    }
                  } catch (error) {
                    console.error(
                      `Failed to fetch GeoJSON for ID ${result.geojsonDataId}:`,
                      error,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Update state if we have new results
      if (latestResults.length > 0) {
        setSpatialResults(latestResults);
        setVisible(true);
      } else if (latestResults.length === 0 && spatialResults.length > 0) {
        // Clear results if no recent spatial analysis queries
        setSpatialResults([]);
        setVisible(false);
      }
    };

    processResults();
  }, [messages, chatId]);

  return {
    spatialResults,
    setSpatialResults,
    clearSpatialResults: () => {
      setSpatialResults([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}
