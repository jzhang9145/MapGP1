import { WebSearch } from './web-search';

interface WebSearchToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const WebSearchTool = ({
  toolCallId,
  state,
  input,
  output,
}: WebSearchToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
          <div className="text-blue-600 text-sm">
            Searching for &quot;{input?.query}&quot;...
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <WebSearch webSearchData={output} />
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
