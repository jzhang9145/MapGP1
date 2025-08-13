'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { useArea } from '@/hooks/use-area';
import { useSchoolZonesFromMessages } from '@/hooks/use-school-zones';
import { useParksFromMessages } from '@/hooks/use-parks';
import { useSpatialAnalysisFromMessages } from '@/hooks/use-spatial-analysis';
import type { ChatMessage } from '@/lib/types';

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
  messages: ChatMessage[];
}

// Default New York City coordinates
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.006;
const DEFAULT_ZOOM = 12;

export function AreaMap({ chatId, messages }: AreaMapProps) {
  const [isClient, setIsClient] = useState(false);
  const { area, isLoading } = useArea(chatId);
  const { schoolZones, isVisible: schoolZonesVisible } = useSchoolZonesFromMessages(messages, chatId);
  const { parks, isVisible: parksVisible } = useParksFromMessages(messages, chatId);
  const { spatialResults, isVisible: spatialResultsVisible } = useSpatialAnalysisFromMessages(messages, chatId);

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
  const currentArea = area;

  // Use default coordinates and zoom
  const latitude = DEFAULT_LATITUDE;
  const longitude = DEFAULT_LONGITUDE;
  const zoom = DEFAULT_ZOOM;

  const name = currentArea?.name || 'New York City';

  if (!isClient || isLoading) {
    return (
      <Card className="size-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </Card>
    );
  }

  return (
    <Card className="size-full overflow-hidden">
      <div className="size-full">
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

          {/* Render School Zone GeoJSON data */}
          {schoolZonesVisible && schoolZones.map((zone, index) => (
            zone.geojson && (
              <GeoJSON
                key={`school-zone-${zone.id}-${index}`}
                data={zone.geojson}
                style={{
                  color: '#9333ea', // Purple color for school zones
                  weight: 2,
                  opacity: 0.8,
                  fillColor: '#9333ea',
                  fillOpacity: 0.1,
                }}
                pointToLayer={(feature, latlng) => {
                  return new (window as any).L.CircleMarker(latlng, {
                    radius: 8,
                    fillColor: '#9333ea',
                    color: '#7c3aed',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.6,
                  });
                }}
                onEachFeature={(feature, layer) => {
                  // Create rich popup for school zones
                  const boroughName = getBoroughName(zone.borough);
                  const popupContent = `
                    <div class="p-3 min-w-[200px]">
                      <h3 class="font-semibold text-sm text-purple-800 mb-1">
                        ${zone.dbn}${zone.schoolName ? ` - ${zone.schoolName}` : ''}
                      </h3>
                      <div class="text-xs text-purple-600 mb-2">
                        ${zone.label || 'Elementary School Zone'}
                      </div>
                      <div class="space-y-1 text-xs">
                        <div><strong>District:</strong> ${zone.schoolDistrict}</div>
                        <div><strong>Borough:</strong> ${boroughName}</div>
                        ${zone.shapeArea ? `<div><strong>Area:</strong> ${parseFloat(zone.shapeArea).toLocaleString()} sq ft</div>` : ''}
                      </div>
                      ${zone.remarks ? `
                        <div class="mt-2 p-2 bg-purple-50 rounded text-xs">
                          <strong>Notes:</strong> ${zone.remarks}
                        </div>
                      ` : ''}
                    </div>
                  `;
                  layer.bindPopup(popupContent);
                }}
              />
            )
          ))}

          {/* Parks Layer - Green color for parks */}
          {parksVisible && parks.map((park) => (
            park.geojson && (
              <GeoJSON
                key={`park-${park.id}`}
                data={park.geojson}
                style={{
                  color: '#16a34a',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: '#16a34a',
                  fillOpacity: 0.3,
                }}
                onEachFeature={(feature, layer) => {
                  const parkName = park.name || park.signname || 'Unnamed Park';
                  const popupContent = `
                    <div class="p-3 min-w-[200px]">
                      <h3 class="font-semibold text-sm text-green-800 mb-1">
                        🏞️ ${parkName}
                      </h3>
                      ${park.signname && park.signname !== park.name ? `
                        <div class="text-xs text-green-600 mb-2">
                          Sign Name: ${park.signname}
                        </div>
                      ` : ''}
                      <div class="space-y-1 text-xs">
                        ${park.borough ? `<div><strong>Borough:</strong> ${getBoroughDisplayName(park.borough)}</div>` : ''}
                        ${park.address ? `<div><strong>Address:</strong> ${park.address}</div>` : ''}
                        ${park.acreage ? `<div><strong>Size:</strong> ${park.acreage} acres</div>` : ''}
                        ${park.typecategory ? `<div><strong>Type:</strong> ${park.typecategory}</div>` : ''}
                        ${park.department ? `<div><strong>Managed by:</strong> ${park.department}</div>` : ''}
                        ${park.waterfront === 'Y' ? `<div class="text-cyan-600"><strong>🌊 Waterfront Location</strong></div>` : ''}
                      </div>
                    </div>
                  `;
                  layer.bindPopup(popupContent);
                }}
              />
            )
          ))}

          {/* Spatial Analysis Results Layer - Various colors based on layer type */}
          {spatialResultsVisible && spatialResults.map((result) => (
            result.geojson && (
              <GeoJSON
                key={`spatial-${result.layerType}-${result.id}`}
                data={result.geojson}
                style={{
                  color: getSpatialResultColor(result.layerType),
                  weight: 3,
                  opacity: 0.9,
                  fillColor: getSpatialResultColor(result.layerType),
                  fillOpacity: 0.4,
                  dashArray: '5, 10', // Dashed line to distinguish spatial results
                }}
                onEachFeature={(feature, layer) => {
                  const name = getSpatialResultName(result);
                  const popupContent = `
                    <div class="p-3 min-w-[200px]">
                      <h3 class="font-semibold text-sm mb-1" style="color: ${getSpatialResultColor(result.layerType)}">
                        🗺️ ${name}
                      </h3>
                      <div class="text-xs text-gray-600 mb-2">
                        Spatial Analysis Result
                      </div>
                      <div class="space-y-1 text-xs">
                        <div><strong>Query:</strong> ${result.analysisQuery || 'Spatial search'}</div>
                        <div><strong>Relation:</strong> ${result.spatialRelation} ${result.filterDescription}</div>
                        <div><strong>Layer:</strong> ${getLayerDisplayName(result.layerType)}</div>
                        ${result.borough ? `<div><strong>Borough:</strong> ${getBoroughDisplayName(result.borough)}</div>` : ''}
                        ${result.address ? `<div><strong>Address:</strong> ${result.address}</div>` : ''}
                        ${result.acreage ? `<div><strong>Size:</strong> ${result.acreage} acres</div>` : ''}
                        ${result.schoolDistrict ? `<div><strong>School District:</strong> ${result.schoolDistrict}</div>` : ''}
                      </div>
                    </div>
                  `;
                  layer.bindPopup(popupContent);
                }}
              />
            )
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}

// Helper function to convert borough codes to names
function getBoroughName(borough: string): string {
  const boroughMap: Record<string, string> = {
    K: 'Brooklyn',
    M: 'Manhattan', 
    Q: 'Queens',
    X: 'Bronx',
    R: 'Staten Island',
  };
  return boroughMap[borough?.toUpperCase()] || borough;
}

// Helper function to get borough display name (for parks)
function getBoroughDisplayName(borough: string): string {
  const boroughMap: Record<string, string> = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
    'M': 'Manhattan',
    'X': 'Bronx',
    'B': 'Brooklyn',
    'K': 'Brooklyn',
    'Q': 'Queens',
    'R': 'Staten Island',
    'Manhattan': 'Manhattan',
    'Bronx': 'Bronx',
    'Brooklyn': 'Brooklyn',
    'Queens': 'Queens',
    'Staten Island': 'Staten Island',
  };
  
  return boroughMap[borough] || borough;
}

// Helper function to get colors for spatial analysis results
function getSpatialResultColor(layerType: string): string {
  const colorMap: Record<string, string> = {
    parks: '#dc2626', // Red for parks in spatial results
    neighborhoods: '#ea580c', // Orange for neighborhoods
    schoolZones: '#7c3aed', // Purple for school zones
  };
  return colorMap[layerType] || '#6366f1'; // Default indigo
}

// Helper function to get names for spatial results
function getSpatialResultName(result: any): string {
  if (result.layerType === 'parks') {
    return result.name || result.signname || 'Unnamed Park';
  } else if (result.layerType === 'neighborhoods') {
    return result.name || 'Unnamed Neighborhood';
  } else if (result.layerType === 'schoolZones') {
    return result.schoolName || result.dbn || result.label || 'School Zone';
  }
  return 'Spatial Result';
}

// Helper function to get layer display names
function getLayerDisplayName(layerType: string): string {
  const nameMap: Record<string, string> = {
    parks: 'Park',
    neighborhoods: 'Neighborhood',
    schoolZones: 'School Zone',
  };
  return nameMap[layerType] || layerType;
}
