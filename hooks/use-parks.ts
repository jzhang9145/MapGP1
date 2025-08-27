import { useState, useEffect } from 'react';
import type { Park } from '@/lib/schemas';

// Function to fetch GeoJSON data by ID
async function fetchGeoJSONData(geojsonDataId: string) {
  try {
    const response = await fetch(`/api/geojson/${geojsonDataId}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch GeoJSON data for park ID ${geojsonDataId}:`,
        response.status,
      );
      return null;
    }
    const data = await response.json();
    return data.geojson;
  } catch (error) {
    console.error(
      `Error fetching GeoJSON data for park ID ${geojsonDataId}:`,
      error,
    );
    return null;
  }
}

// Hook to manage parks from chat messages
export function useParksFromMessages(messages: any[], chatId: string) {
  const [parks, setParks] = useState<Park[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const processResults = async () => {
      const latestParks: Park[] = [];

      // Look for parks tool results in the messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.parts) {
          for (const part of message.parts) {
            if (
              part.type === 'tool-nycParks' &&
              'output' in part &&
              part.state === 'output-available' &&
              !('error' in part.output) &&
              part.output?.parks
            ) {
              // Process parks with GeoJSON data or geojsonDataId
              for (const park of part.output.parks) {
                if (park.geojson && Object.keys(park.geojson).length > 0) {
                  // Direct GeoJSON data
                  latestParks.push(park);
                } else if (park.geojsonDataId) {
                  // Fetch GeoJSON data by ID
                  try {
                    const geojsonData = await fetchGeoJSONData(
                      park.geojsonDataId,
                    );
                    if (geojsonData) {
                      latestParks.push({
                        ...park,
                        geojson: geojsonData,
                      });
                    }
                  } catch (error) {
                    console.error(
                      `Failed to fetch GeoJSON for park ${park.name}:`,
                      error,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Update state if we have new parks
      if (latestParks.length > 0) {
        setParks(latestParks);
        setVisible(true);
      } else if (latestParks.length === 0 && parks.length > 0) {
        // Clear parks if no recent park queries
        setParks([]);
        setVisible(false);
      }
    };

    processResults();
  }, [messages, chatId]);

  return {
    parks,
    setParks,
    clearParks: () => {
      setParks([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}
