import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { useMemo } from 'react';
import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import type { ChatMessage } from '@/lib/types';

interface Area {
  chatId: string;
  name: string;
  summary: string;
  geojson: any; // For backward compatibility
  geojsonDataId?: string; // New field for reference
}

export function useArea(chatId: string) {
  const url = useMemo(
    () => (chatId ? `/api/chat/${chatId}/area` : null),
    [chatId],
  );
  const { data, error, mutate } = useSWR<{ area: Area | null }>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
  });

  return {
    area: data?.area || null,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useAreaUpdates(messages: ChatMessage[], chatId: string) {
  const { mutate: globalMutate } = useSWRConfig();
  const processedToolCalls = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Look for completed area update tool calls in the messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach((part) => {
          if (
            part.type === 'tool-updateArea' &&
            'output' in part &&
            part.state === 'output-available' &&
            !('error' in part.output) &&
            !processedToolCalls.current.has(part.toolCallId)
          ) {
            // Mark this tool call as processed
            processedToolCalls.current.add(part.toolCallId);

            // Trigger area mutation
            const areaKey = `/api/chat/${chatId}/area`;
            globalMutate(areaKey);
          }
        });
      }
    });
  }, [messages, chatId, globalMutate]);
}
