import { useState, useEffect } from 'react';
import type { CensusBlock } from '@/lib/schemas';

// Function to fetch GeoJSON data by ID
async function fetchGeoJSONData(geojsonDataId: string) {
  try {
    const response = await fetch(`/api/geojson/${geojsonDataId}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch GeoJSON data for census block ID ${geojsonDataId}:`,
        response.status,
      );
      return null;
    }
    const data = await response.json();
    return data.geojson;
  } catch (error) {
    console.error(
      `Error fetching GeoJSON data for census block ID ${geojsonDataId}:`,
      error,
    );
    return null;
  }
}

// Hook to manage census blocks from chat messages
export function useCensusFromMessages(messages: any[], chatId: string) {
  const [censusBlocks, setCensusBlocks] = useState<CensusBlock[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const processResults = async () => {
      const latestCensusBlocks: CensusBlock[] = [];

      // Look for census tool results in the messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.parts) {
          for (const part of message.parts) {
            if (
              part.type === 'tool-nycCensus' &&
              'output' in part &&
              part.state === 'output-available' &&
              !('error' in part.output) &&
              part.output?.censusBlocks
            ) {
              // Process census blocks with GeoJSON data or geojsonDataId
              for (const block of part.output.censusBlocks) {
                if (block.geojson && Object.keys(block.geojson).length > 0) {
                  // Direct GeoJSON data
                  latestCensusBlocks.push(block);
                } else if (block.geojsonDataId) {
                  // Fetch GeoJSON data by ID
                  try {
                    const geojsonData = await fetchGeoJSONData(
                      block.geojsonDataId,
                    );
                    if (geojsonData) {
                      latestCensusBlocks.push({
                        ...block,
                        geojson: geojsonData,
                      });
                    }
                  } catch (error) {
                    console.error(
                      `Failed to fetch GeoJSON for census block ${block.geoid || block.id}:`,
                      error,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Update state if we have new census blocks
      if (latestCensusBlocks.length > 0) {
        setCensusBlocks(latestCensusBlocks);
        setVisible(true);
      } else if (latestCensusBlocks.length === 0 && censusBlocks.length > 0) {
        // Clear census blocks if no recent census queries
        setCensusBlocks([]);
        setVisible(false);
      }
    };

    processResults();
  }, [messages, chatId]);

  return {
    censusBlocks,
    setCensusBlocks,
    clearCensusBlocks: () => {
      setCensusBlocks([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}
