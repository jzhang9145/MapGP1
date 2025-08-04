import type { NeighborhoodData } from '@/lib/schemas';

interface NYCNeighborhoodsToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: NeighborhoodData;
}

export const NYCNeighborhoodsTool = ({
  toolCallId,
  state,
  input,
  output,
}: NYCNeighborhoodsToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
          <div className="text-blue-600 text-sm">
            Fetching NYC neighborhoods...
            {input?.borough !== 'All' && ` for ${input?.borough}`}
            {input?.format === 'summary' && ' (summary format)'}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    return (
      <div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-4 rounded-full bg-blue-500" />
            <div className="text-blue-700 font-medium">
              NYC Neighborhoods Data
            </div>
          </div>
          <div className="text-blue-600 text-sm mb-1">
            <strong>Name:</strong> {output?.name}
          </div>
          <div className="text-sm text-blue-600 mb-1">
            <div>
              <strong>Borough:</strong> {output?.borough}
            </div>
          </div>
          <div className="text-blue-600 text-xs mb-1">
            <strong>GeoJSON Data ID:</strong> {output?.geojsonDataId}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error fetching NYC neighborhoods: {String(output || 'Unknown error')}
      </div>
    );
  }

  return null;
};
