import { useState, useEffect } from 'react';
import type { NYCMapPLUTO } from '@/lib/db/schema';

interface MapPLUTOWithGeoJSON extends NYCMapPLUTO {
  geojson?: any;
}

// Hook to manage MapPLUTO properties from chat messages
export function useMapPLUTOFromMessages(messages: any[], chatId: string) {
  const [properties, setProperties] = useState<MapPLUTOWithGeoJSON[]>([]);
  const [isVisible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const latestProperties: NYCMapPLUTO[] = [];

    // Look for MapPLUTO tool results in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            part.type === 'tool-mappluto' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.properties
          ) {
            // Add properties with GeoJSON data to the map
            const propertiesWithGeometry = part.output.properties.filter((prop: NYCMapPLUTO) => 
              prop.geojsonDataId && prop.geojsonDataId !== null
            );
            latestProperties.push(...propertiesWithGeometry);
          }
        });
      }
    });

    // Fetch GeoJSON data for properties if we have new ones
    if (latestProperties.length > 0) {
      setIsLoading(true);
      
      // Extract unique GeoJSON data IDs
      const geojsonDataIds = [...new Set(
        latestProperties
          .map(prop => prop.geojsonDataId)
          .filter(id => id !== null) as string[]
      )];

      // Fetch the GeoJSON data
      if (geojsonDataIds.length > 0) {
        fetch('/api/mappluto/geojson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geojsonDataIds }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.properties) {
              setProperties(data.properties);
              setVisible(true);
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Failed to fetch MapPLUTO GeoJSON data:', error);
            // Fallback to properties without GeoJSON
            setProperties(latestProperties);
            setVisible(true);
            setIsLoading(false);
          });
      } else {
        setProperties(latestProperties);
        setVisible(true);
        setIsLoading(false);
      }
    } else if (latestProperties.length === 0 && properties.length > 0) {
      // Clear properties if no recent MapPLUTO queries
      setProperties([]);
      setVisible(false);
      setIsLoading(false);
    }
  }, [messages, chatId]);

  return {
    properties,
    setProperties,
    clearProperties: () => {
      setProperties([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
    isLoading,
  };
}
