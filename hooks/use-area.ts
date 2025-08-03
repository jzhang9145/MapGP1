import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

interface Area {
  chatId: string;
  name: string;
  summary: string;
  geojson: any; // For backward compatibility
  geojsonDataId?: string; // New field for reference
}

export function useArea(chatId: string) {
  const { data, error, mutate } = useSWR<{ area: Area | null }>(
    chatId ? `/api/chat/${chatId}/area` : null,
    fetcher,
  );

  const updateArea = async (areaData: {
    name: string;
    summary: string;
    geojson: any;
  }) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/area`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaData),
      });

      if (!response.ok) {
        throw new Error('Failed to update area');
      }

      const result = await response.json();
      mutate(result, false);
      return result.area;
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  };

  return {
    area: data?.area || null,
    isLoading: !error && !data,
    isError: error,
    updateArea,
    mutate,
  };
}
