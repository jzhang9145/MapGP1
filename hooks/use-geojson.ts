import { useEffect, useState } from 'react';

export function useGeoJSONFromMessages(messages: any[], chatId: string) {
  const [collections, setCollections] = useState<any[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const rawCollections: any[] = [];

    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.geojson &&
            part.output.geojson.type === 'FeatureCollection'
          ) {
            const fc = part.output.geojson;
            // Sanitize ArcGIS extras (crs, properties)
            if (fc && typeof fc === 'object') {
              const {
                crs: _omitCrs,
                properties: _omitProps,
                ...cleaned
              } = fc as any;
              rawCollections.push(cleaned);
            } else {
              rawCollections.push(fc);
            }
          }
        });
      }
    });

    if (rawCollections.length > 0) {
      setCollections(rawCollections);
      setVisible(true);
    } else if (rawCollections.length === 0 && collections.length > 0) {
      setCollections([]);
      setVisible(false);
    }
  }, [messages, chatId]);

  return {
    collections,
    isVisible,
    clear: () => {
      setCollections([]);
      setVisible(false);
    },
  };
}
