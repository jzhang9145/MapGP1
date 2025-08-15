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
            // Check for direct geojson field (new API approach) or geojsonDataId (old DB approach)
            const propertiesWithGeometry = part.output.properties.filter((prop: any) => 
              prop.geojson || (prop.geojsonDataId && prop.geojsonDataId !== null)
            );
            latestProperties.push(...propertiesWithGeometry);
          }
        });
      }
    });

    // Handle properties with geometry
    if (latestProperties.length > 0) {
      setIsLoading(true);
      
      // Check if we have properties with direct geojson data (new API approach)
      const propertiesWithDirectGeoJSON = latestProperties.filter((prop: any) => prop.geojson);
      const propertiesNeedingFetch = latestProperties.filter((prop: any) => 
        !prop.geojson && prop.geojsonDataId && prop.geojsonDataId !== null
      );

      // If we have properties with direct GeoJSON, use them immediately
      if (propertiesWithDirectGeoJSON.length > 0) {
        setProperties(propertiesWithDirectGeoJSON);
        setVisible(true);
        setIsLoading(false);
      } 
      // Otherwise, try to fetch GeoJSON data for properties with geojsonDataId
      else if (propertiesNeedingFetch.length > 0) {
        const geojsonDataIds = [...new Set(
          propertiesNeedingFetch.map(prop => prop.geojsonDataId).filter(id => id !== null) as string[]
        )];

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
        // No geometry available
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
