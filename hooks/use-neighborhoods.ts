import { useState, useEffect } from 'react';

// Function to fetch GeoJSON data by ID
async function fetchGeoJSONData(geojsonDataId: string) {
  try {
    const response = await fetch(`/api/geojson/${geojsonDataId}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch GeoJSON data for neighborhood ID ${geojsonDataId}:`,
        response.status,
      );
      return null;
    }
    const data = await response.json();
    return data.geojson;
  } catch (error) {
    console.error(
      `Error fetching GeoJSON data for neighborhood ID ${geojsonDataId}:`,
      error,
    );
    return null;
  }
}

// Hook to manage neighborhoods from chat messages
export function useNeighborhoodsFromMessages(messages: any[], chatId: string) {
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const processResults = async () => {
      const latestNeighborhoods: any[] = [];

      // Look for NYC neighborhoods tool results in the messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.parts) {
          for (const part of message.parts) {
            if (
              part.type === 'tool-nycNeighborhoods' &&
              'output' in part &&
              part.state === 'output-available' &&
              !('error' in part.output)
            ) {
              // Handle single neighborhood result
              if (part.output?.geojsonDataId) {
                try {
                  const geojsonData = await fetchGeoJSONData(
                    part.output.geojsonDataId,
                  );
                  if (geojsonData) {
                    // Sanitize GeoJSON data
                    const {
                      crs: _omitCrs,
                      properties: _omitProps,
                      ...cleaned
                    } = geojsonData;
                    latestNeighborhoods.push({
                      id: part.output.id || part.output.name,
                      name: part.output.name,
                      borough: part.output.borough,
                      nta_code: part.output.nta_code,
                      nta_2020: part.output.nta_2020,
                      cdtca: part.output.cdtca,
                      cdtca_name: part.output.cdtca_name,
                      center_lat: part.output.center_lat,
                      center_lng: part.output.center_lng,
                      shape_area: part.output.shape_area,
                      shape_leng: part.output.shape_leng,
                      geojson: cleaned,
                      source: 'nycNeighborhoods',
                    });
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch GeoJSON for neighborhood:`,
                    error,
                  );
                }
              }

              // Handle direct GeoJSON in output (legacy format)
              else if (
                part.output?.geojson &&
                Object.keys(part.output.geojson).length > 0
              ) {
                const {
                  crs: _omitCrs,
                  properties: _omitProps,
                  ...cleaned
                } = part.output.geojson;
                latestNeighborhoods.push({
                  id: part.output.id || part.output.name,
                  name: part.output.name,
                  borough: part.output.borough,
                  nta_code: part.output.nta_code,
                  nta_2020: part.output.nta_2020,
                  cdtca: part.output.cdtca,
                  cdtca_name: part.output.cdtca_name,
                  center_lat: part.output.center_lat,
                  center_lng: part.output.center_lng,
                  shape_area: part.output.shape_area,
                  shape_leng: part.output.shape_leng,
                  geojson: cleaned,
                  source: 'nycNeighborhoods',
                });
              }
            }
          }
        }
      }

      // Update state if we have new neighborhoods
      if (latestNeighborhoods.length > 0) {
        setNeighborhoods(latestNeighborhoods);
        setVisible(true);
      } else if (latestNeighborhoods.length === 0 && neighborhoods.length > 0) {
        // Clear neighborhoods if no recent neighborhood queries
        setNeighborhoods([]);
        setVisible(false);
      }
    };

    processResults();
  }, [messages, chatId]);

  return {
    neighborhoods,
    setNeighborhoods,
    clearNeighborhoods: () => {
      setNeighborhoods([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}
