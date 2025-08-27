'use client';

import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  const fetchJson = async (key: string) => {
    if (typeof key !== 'string') return null;
    // Only fetch HTTP/HTTPS or relative URLs; ignore custom SWR keys like "messages:*"
    const isHttpLike =
      key.startsWith('/') ||
      key.startsWith('http://') ||
      key.startsWith('https://');
    if (!isHttpLike) return null;

    const res = await fetch(key);
    if (!res.ok) {
      // Best-effort to surface useful error details
      let payload: unknown = null;
      try {
        const ct = res.headers.get('content-type') || '';
        payload = ct.includes('application/json')
          ? await res.json()
          : await res.text();
      } catch {}
      const err = new Error(`Request failed: ${res.status}`) as Error & {
        status?: number;
        payload?: unknown;
      };
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return res.json();
  };

  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
