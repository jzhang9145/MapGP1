interface PlutoToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const PlutoTool = ({
  toolCallId,
  state,
  input,
  output,
}: PlutoToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
          <div className="text-blue-600 text-sm">
            Searching PLUTO database...
            {input?.bbl && ` Looking for BBL: ${input.bbl}`}
            {input?.search && ` Searching for: "${input.search}"`}
            {input?.borough && ` Filtering by borough: ${input.borough}`}
            {input?.landUse && ` Filtering by land use: ${input.landUse}`}
            {input?.zoningDistrict &&
              ` Filtering by zoning: ${input.zoningDistrict}`}
            {input?.areaId && ` Querying area: ${input.areaId}`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error searching PLUTO: {String(output.error)}
        </div>
      );
    }

    const { query, totalResults, results } = output;

    return (
      <div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-4 rounded-full bg-blue-500" />
            <div className="text-blue-700 font-medium">
              PLUTO Search Results
            </div>
          </div>
          <div className="text-blue-600 text-sm mb-3">
            <strong>Query:</strong> {query} | <strong>Results:</strong>{' '}
            {totalResults} lots found
          </div>

          {results && results.length > 0 && (
            <div className="space-y-3">
              {results.slice(0, 5).map((lot: any, index: number) => (
                <div
                  key={lot.bbl || index}
                  className="bg-white p-3 rounded border"
                >
                  <div className="font-medium text-sm">
                    {lot.address || `BBL: ${lot.bbl}`}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mt-1">
                    <div>
                      <strong>BBL:</strong> {lot.bbl} |{' '}
                      <strong>Borough:</strong> {lot.borough}
                    </div>
                    {lot.ownerName && (
                      <div>
                        <strong>Owner:</strong> {lot.ownerName}
                      </div>
                    )}
                    {lot.landUse && (
                      <div>
                        <strong>Land Use:</strong> {lot.landUse}
                      </div>
                    )}
                    {lot.buildingClass && (
                      <div>
                        <strong>Building Class:</strong> {lot.buildingClass}
                      </div>
                    )}
                    {lot.zoningDistrict && (
                      <div>
                        <strong>Zoning:</strong> {lot.zoningDistrict}
                      </div>
                    )}
                    {lot.yearBuilt && (
                      <div>
                        <strong>Year Built:</strong> {lot.yearBuilt}
                      </div>
                    )}
                    {lot.lotArea && (
                      <div>
                        <strong>Lot Area:</strong>{' '}
                        {lot.lotArea.toLocaleString()} sq ft
                      </div>
                    )}
                    {lot.bldgArea && (
                      <div>
                        <strong>Building Area:</strong>{' '}
                        {lot.bldgArea.toLocaleString()} sq ft
                      </div>
                    )}
                    {lot.numStories && (
                      <div>
                        <strong>Stories:</strong> {lot.numStories}
                      </div>
                    )}
                    {lot.assessTot && (
                      <div>
                        <strong>Assessed Value:</strong> $
                        {lot.assessTot.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {results.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  ... and {results.length - 5} more lots
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error searching PLUTO: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
