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

    // Look for MapPLUTO tool results in the messages (support both local and remote arcgis cases)
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            (part.type === 'tool-mappluto' ||
              part.type === 'tool-pluto' ||
              part.type === 'tool-parcels') &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output)
          ) {
            // Case 1: summarized results (properties or results)
            if (part.output?.properties || part.output?.results) {
              const summarized =
                part.output?.properties ?? part.output?.results;
              const propertiesWithGeometry = summarized.filter(
                (prop: any) =>
                  (prop.geojsonDataId && prop.geojsonDataId !== null) ||
                  !!prop.geojson,
              );
              // If we have a shared geojsonDataId reference, fetch it once
              const sharedId = propertiesWithGeometry.find(
                (p: any) => p.geojsonDataId,
              )?.geojsonDataId;
              if (
                sharedId &&
                !propertiesWithGeometry.some((p: any) => p.geojson)
              ) {
                // Fetch shared GeoJSON, flatten FeatureCollection into pseudo-properties
                fetch(`/api/geojson/${sharedId}`)
                  .then((r) => r.json())
                  .then((gj) => {
                    const fc = gj.geojson;
                    if (fc && typeof fc === 'object') {
                      const {
                        crs: _omitCrs,
                        properties: _omitProps,
                        ...cleaned
                      } = fc as any;
                      if (Array.isArray((cleaned as any).features)) {
                        const pseudoProps = (cleaned as any).features.map(
                          (f: any, idx: number) => ({
                            id: `arcgis-${idx}`,
                            bbl: String(f?.properties?.BBL ?? ''),
                            borough: f?.properties?.Borough ?? '',
                            geojson: f,
                          }),
                        );
                        // @ts-ignore
                        latestProperties.push(...pseudoProps);
                        setProperties([...latestProperties]);
                        setVisible(true);
                        return;
                      }
                    }
                    // Fallback: push summarized entries (may not render without geometry)
                    // @ts-ignore
                    latestProperties.push(...propertiesWithGeometry);
                    setProperties([...latestProperties]);
                    setVisible(true);
                  })
                  .catch(() => {
                    // Fallback: push as-is
                    // @ts-ignore
                    latestProperties.push(...propertiesWithGeometry);
                    setProperties([...latestProperties]);
                    setVisible(true);
                  });
              } else {
                // @ts-ignore store loosely typed entries for rendering only
                latestProperties.push(...propertiesWithGeometry);
              }
            }
            // Case 2: remote ArcGIS FeatureCollection (from live pluto tool)
            if (
              part.output?.geojson &&
              part.output.geojson.type === 'FeatureCollection'
            ) {
              // Directly render remote features by storing a faux property with embedded geojson
              // so AreaMap can display via the GeoJSON layer.
              const fc = part.output.geojson;
              // Sanitize ArcGIS extras that can confuse some GeoJSON renderers
              if (fc && typeof fc === 'object') {
                const {
                  crs: _omitCrs,
                  properties: _omitProps,
                  ...cleaned
                } = fc as any;
                (part.output as any).geojson = cleaned;
              }
              // Flatten features into pseudo-properties for rendering
              const pseudoProps = fc.features.map((f: any, idx: number) => ({
                id: `arcgis-${idx}`,
                bbl: String(f?.properties?.BBL ?? ''),
                borough: f?.properties?.Borough ?? '',
                geojson: f, // attach feature directly
              }));
              // @ts-ignore store loosely typed entries for rendering only
              latestProperties.push(...pseudoProps);
            }
          }
        });
      }
    });

    // If we already have embedded geojson (remote), just display.
    const hasEmbeddedGeo = latestProperties.some((p: any) => !!p.geojson);

    if (latestProperties.length > 0) {
      setIsLoading(true);

      // Extract unique GeoJSON data IDs
      const geojsonDataIds = [
        ...new Set(
          latestProperties
            .map((prop) => prop.geojsonDataId)
            .filter((id) => id !== null) as string[],
        ),
      ];

      // Fetch the GeoJSON data
      if (!hasEmbeddedGeo && geojsonDataIds.length > 0) {
        fetch('/api/mappluto/geojson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geojsonDataIds }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.properties) {
              setProperties(data.properties);
              setVisible(true);
            }
            setIsLoading(false);
          })
          .catch((error) => {
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
