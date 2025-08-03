'use client';

import { ArrowUpIcon } from '../icons';

interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchData {
  query: string;
  results: WebSearchResult[];
  totalResults?: string;
  error?: string;
}

export function WebSearch({ webSearchData }: { webSearchData: WebSearchData }) {
  if (webSearchData.error) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-red-50 border border-red-200 max-w-[600px]">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-sm">!</span>
          </div>
          <div className="text-red-800 font-medium">Search Error</div>
        </div>
        <div className="text-red-700 text-sm">{webSearchData.error}</div>
      </div>
    );
  }

  if (!webSearchData.results || webSearchData.results.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-gray-50 border border-gray-200 max-w-[600px]">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-600 text-sm">?</span>
          </div>
          <div className="text-gray-800 font-medium">No Results Found</div>
        </div>
        <div className="text-gray-700 text-sm">
          No search results found for "{webSearchData.query}"
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-4 bg-blue-50 border border-blue-200 max-w-[600px]">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-sm">🔍</span>
        </div>
        <div className="text-blue-800 font-medium">Web Search Results</div>
        {webSearchData.totalResults && (
          <div className="text-blue-600 text-sm">
            ({webSearchData.totalResults} results)
          </div>
        )}
      </div>

      <div className="text-blue-700 text-sm font-medium">
        Query: "{webSearchData.query}"
      </div>

      <div className="flex flex-col gap-3">
        {webSearchData.results.map((result, index) => (
          <div
            key={`${result.link}-${index}`}
            className="flex flex-col gap-1 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors"
          >
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm group"
            >
              {result.title}
              <ArrowUpIcon />
            </a>
            <div className="text-gray-600 text-xs">{result.link}</div>
            <div className="text-gray-700 text-sm leading-relaxed">
              {result.snippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 