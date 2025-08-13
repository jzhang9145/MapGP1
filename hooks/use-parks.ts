import { useState, useEffect } from 'react';
import type { Park } from '@/lib/schemas';

// Hook to manage parks from chat messages
export function useParksFromMessages(messages: any[], chatId: string) {
  const [parks, setParks] = useState<Park[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const latestParks: Park[] = [];

    // Look for parks tool results in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            part.type === 'tool-nycParks' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.parks
          ) {
            // Add parks with GeoJSON data to the map
            const parksWithGeometry = part.output.parks.filter((park: Park) => 
              park.geojson && Object.keys(park.geojson).length > 0
            );
            latestParks.push(...parksWithGeometry);
          }
        });
      }
    });

    // Update state if we have new parks
    if (latestParks.length > 0) {
      setParks(latestParks);
      setVisible(true);
    } else if (latestParks.length === 0 && parks.length > 0) {
      // Clear parks if no recent park queries
      setParks([]);
      setVisible(false);
    }
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