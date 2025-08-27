import { createContext, useContext, useState, useEffect } from 'react';
import type { SchoolZone } from '@/lib/schemas';

// Function to fetch GeoJSON data by ID
async function fetchGeoJSONData(geojsonDataId: string) {
  try {
    const response = await fetch(`/api/geojson/${geojsonDataId}`);
    if (!response.ok) {
      console.error(
        `Failed to fetch GeoJSON data for school zone ID ${geojsonDataId}:`,
        response.status,
      );
      return null;
    }
    const data = await response.json();
    return data.geojson;
  } catch (error) {
    console.error(
      `Error fetching GeoJSON data for school zone ID ${geojsonDataId}:`,
      error,
    );
    return null;
  }
}

interface SchoolZonesContextType {
  schoolZones: SchoolZone[];
  setSchoolZones: (zones: SchoolZone[]) => void;
  clearSchoolZones: () => void;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

export const SchoolZonesContext = createContext<SchoolZonesContextType | null>(
  null,
);

export function useSchoolZones() {
  const context = useContext(SchoolZonesContext);
  if (!context) {
    throw new Error('useSchoolZones must be used within a SchoolZonesProvider');
  }
  return context;
}

// Hook to manage school zones from chat messages
export function useSchoolZonesFromMessages(messages: any[], chatId: string) {
  const [schoolZones, setSchoolZones] = useState<SchoolZone[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const processResults = async () => {
      const latestSchoolZones: SchoolZone[] = [];

      // Look for school zone tool results in the messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.parts) {
          for (const part of message.parts) {
            if (
              part.type === 'tool-nycSchoolZones' &&
              'output' in part &&
              part.state === 'output-available' &&
              !('error' in part.output) &&
              part.output?.zones
            ) {
              // Process zones with GeoJSON data or geojsonDataId
              for (const zone of part.output.zones) {
                if (zone.geojson && Object.keys(zone.geojson).length > 0) {
                  // Direct GeoJSON data
                  latestSchoolZones.push(zone);
                } else if (zone.geojsonDataId) {
                  // Fetch GeoJSON data by ID
                  try {
                    const geojsonData = await fetchGeoJSONData(
                      zone.geojsonDataId,
                    );
                    if (geojsonData) {
                      latestSchoolZones.push({
                        ...zone,
                        geojson: geojsonData,
                      });
                    }
                  } catch (error) {
                    console.error(
                      `Failed to fetch GeoJSON for school zone ${zone.dbn || zone.schoolName}:`,
                      error,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Update state if we have new school zones
      if (latestSchoolZones.length > 0) {
        setSchoolZones(latestSchoolZones);
        setVisible(true);
      } else if (latestSchoolZones.length === 0 && schoolZones.length > 0) {
        // Clear zones if no recent school zone queries
        setSchoolZones([]);
        setVisible(false);
      }
    };

    processResults();
  }, [messages, chatId]);

  return {
    schoolZones,
    setSchoolZones,
    clearSchoolZones: () => {
      setSchoolZones([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}
