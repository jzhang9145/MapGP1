interface NYCNeighborhoodsToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
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
            {input?.borough !== 'All' && ` for ${input.borough}`}
            {input?.format === 'summary' && ' (summary format)'}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error fetching NYC neighborhoods: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-4 rounded-full bg-blue-500" />
            <div className="text-blue-700 font-medium">
              NYC Neighborhoods Data
            </div>
          </div>
          <div className="text-blue-600 text-sm mb-2">
            <strong>Source:</strong> {output.source} - {output.dataset}
            {output.dataType && (
              <div className="text-xs text-blue-500 mt-1">
                <strong>Data Type:</strong> {output.dataType}
              </div>
            )}
            {output.note && (
              <div className="text-xs text-blue-400 mt-1 italic">
                {output.note}
              </div>
            )}
          </div>
          <div className="text-sm text-blue-600">
            <div>
              <strong>Borough:</strong> {output.borough}
            </div>
            {output.format === 'summary' ? (
              <>
                <div>
                  <strong>Total Neighborhoods:</strong>{' '}
                  {(output as any).totalNeighborhoods}
                </div>
                {(output as any).boroughCounts && (
                  <div>
                    <strong>By Borough:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries((output as any).boroughCounts).map(
                        ([borough, count]) => (
                          <li key={borough}>
                            • {borough}: {String(count)}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {(output as any).neighborhoods &&
                  (output as any).neighborhoods.length > 0 && (
                    <div>
                      <strong>Sample Neighborhoods:</strong>
                      <ul className="ml-4 mt-1">
                        {(output as any).neighborhoods
                          .slice(0, 5)
                          .map((neighborhood: any) => (
                            <li key={neighborhood.name}>
                              • {neighborhood.name} ({neighborhood.borough})
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
              </>
            ) : (
              <>
                <div>
                  <strong>Total Features:</strong> {output.totalFeatures}
                </div>
                {output.summary?.boroughs && (
                  <div>
                    <strong>Boroughs:</strong>{' '}
                    {output.summary.boroughs.join(', ')}
                  </div>
                )}
                {output.summary?.neighborhoods && (
                  <div>
                    <strong>Neighborhoods:</strong>
                    <div className="text-xs mt-1 bg-blue-100 p-2 rounded max-h-20 overflow-y-auto">
                      {output.summary.neighborhoods.slice(0, 10).join(', ')}
                      {output.summary.neighborhoods.length > 10 && '...'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error fetching NYC neighborhoods:{' '}
        {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
