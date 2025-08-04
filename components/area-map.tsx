'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { useArea } from '@/hooks/use-area';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false },
);

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

// Add GeoJSON layer support
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false },
);

interface AreaMapProps {
  chatId: string;
  area?: {
    chatId: string;
    name: string;
    summary: string;
    geojson: any;
    geojsonDataId?: string;
  } | null;
}

// Default New York City coordinates
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.006;
const DEFAULT_ZOOM = 12;

export function AreaMap({ chatId, area: initialArea }: AreaMapProps) {
  const [isClient, setIsClient] = useState(false);
  const { area, isLoading } = useArea(chatId);

  useEffect(() => {
    setIsClient(true);

    // Fix Leaflet icon issue - only run on client side
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Use the area from the hook if available, otherwise fall back to the initial area
  const currentArea = area || initialArea;

  // Use default coordinates and zoom
  const latitude = DEFAULT_LATITUDE;
  const longitude = DEFAULT_LONGITUDE;
  const zoom = DEFAULT_ZOOM;

  const name = currentArea?.name || 'New York City';
  const summary =
    currentArea?.summary ||
    'The Big Apple - A vibrant metropolis known for its iconic skyline, diverse culture, and endless opportunities.';

  if (!isClient || isLoading) {
    return (
      <Card className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full overflow-hidden">
      <div className="h-full w-full">
        <MapContainer
          center={[latitude, longitude]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render GeoJSON data as-is without any manipulation */}
          {currentArea?.geojson && (
            <GeoJSON
              data={currentArea.geojson}
              style={{
                color: '#3b82f6',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
              }}
              pointToLayer={(feature, latlng) => {
                // Custom marker for points
                return new (window as any).L.CircleMarker(latlng, {
                  radius: 6,
                  fillColor: '#3b82f6',
                  color: '#1d4ed8',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.8,
                });
              }}
              onEachFeature={(feature, layer) => {
                // Add popup for each feature using the data as-is
                if (feature.properties) {
                  const popupContent = `
                    <div class="p-2">
                      <h3 class="font-semibold text-sm">${feature.properties.name || name}</h3>
                      <p class="text-xs text-muted-foreground mt-1">${feature.properties.borough || ''}</p>
                    </div>
                  `;
                  layer.bindPopup(popupContent);
                }
              }}
            />
          )}
        </MapContainer>
      </div>
    </Card>
  );
}
