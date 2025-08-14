import { useState, useEffect } from 'react';
import type { CensusBlock } from '@/lib/schemas';

// Hook to manage census blocks from chat messages
export function useCensusFromMessages(messages: any[], chatId: string) {
  const [censusBlocks, setCensusBlocks] = useState<CensusBlock[]>([]);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const latestCensusBlocks: CensusBlock[] = [];

    // Look for census tool results in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part: any) => {
          if (
            part.type === 'tool-nycCensus' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            part.output?.censusBlocks
          ) {
            // Add census blocks with GeoJSON data to the map
            const blocksWithGeometry = part.output.censusBlocks.filter((block: CensusBlock) =>
              block.geojson && Object.keys(block.geojson).length > 0
            );
            latestCensusBlocks.push(...blocksWithGeometry);
          }
        });
      }
    });

    // Update state if we have new census blocks
    if (latestCensusBlocks.length > 0) {
      setCensusBlocks(latestCensusBlocks);
      setVisible(true);
    } else if (latestCensusBlocks.length === 0 && censusBlocks.length > 0) {
      // Clear census blocks if no recent census queries
      setCensusBlocks([]);
      setVisible(false);
    }
  }, [messages, chatId]);

  return {
    censusBlocks,
    setCensusBlocks,
    clearCensusBlocks: () => {
      setCensusBlocks([]);
      setVisible(false);
    },
    isVisible,
    setVisible,
  };
}