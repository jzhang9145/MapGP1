import { useState, useEffect } from 'react';

// Hook to manage spatial analysis results from chat messages
export function useSpatialAnalysisFromMessages(messages: any[], chatId: string) {
  const [spatialResults, setSpatialResults] = useState<any[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const latestResults: any[] = [];

    // Look for spatial analysis tool results in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            part.type === 'tool-spatialAnalysis' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.results
          ) {
            // Add results with GeoJSON data to the map
            const resultsWithGeometry = part.output.results
              .filter((result: any) => result.geojson && Object.keys(result.geojson).length > 0)
              .map((result: any) => ({
                ...result,
                layerType: part.output.primaryLayer, // Track which layer this result belongs to
                analysisQuery: part.output.query,
                spatialRelation: part.output.spatialRelation,
                filterDescription: part.output.filterDescription,
              }));
            
            latestResults.push(...resultsWithGeometry);
          }
        });
      }
    });

    // Update state if we have new results
    if (latestResults.length > 0) {
      setSpatialResults(latestResults);
      setVisible(true);
    } else if (latestResults.length === 0 && spatialResults.length > 0) {
      // Clear results if no recent spatial analysis queries
      setSpatialResults([]);
      setVisible(false);
    }
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