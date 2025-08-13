import { createContext, useContext, useState, useEffect } from 'react';
import type { SchoolZone, Park } from '@/lib/schemas';

interface SchoolZonesContextType {
  schoolZones: SchoolZone[];
  setSchoolZones: (zones: SchoolZone[]) => void;
  clearSchoolZones: () => void;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

export const SchoolZonesContext = createContext<SchoolZonesContextType | null>(null);

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
    const latestSchoolZones: SchoolZone[] = [];

    // Look for school zone tool results in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            part.type === 'tool-nycSchoolZones' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.zones
          ) {
            // Add zones with GeoJSON data to the map
            const zonesWithGeometry = part.output.zones.filter((zone: SchoolZone) => 
              zone.geojson && Object.keys(zone.geojson).length > 0
            );
            latestSchoolZones.push(...zonesWithGeometry);
          }
        });
      }
    });

    // Update state if we have new school zones
    if (latestSchoolZones.length > 0) {
      setSchoolZones(latestSchoolZones);
      setVisible(true);
    } else if (latestSchoolZones.length === 0 && schoolZones.length > 0) {
      // Clear zones if no recent school zone queries
      setSchoolZones([]);
      setVisible(false);
    }
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