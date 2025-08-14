import type { CensusResponse, CensusBlock } from '@/lib/schemas';

interface NYCCensusToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: CensusResponse;
}

export const NYCCensusTool = ({
  toolCallId,
  state,
  input,
  output,
}: NYCCensusToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
          <div className="text-blue-600 text-sm">
            Fetching NYC census data...
            {input?.searchTerm && ` for "${input.searchTerm}"`}
            {input?.minPopulation && ` with min population ${input.minPopulation}`}
            {input?.minIncome && ` with min income $${input.minIncome?.toLocaleString()}`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available' && output?.censusBlocks) {
    const censusBlocks = output.censusBlocks;
    const summary = output.summary;
    
    return (
      <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-lg">
        <div className="text-blue-600 text-sm font-semibold">
          Found {censusBlocks.length} Census Block{censusBlocks.length !== 1 ? 's' : ''}:
        </div>
        
        {summary && (
          <div className="bg-white rounded-md p-3 text-sm">
            <div className="font-medium text-blue-800 mb-2">📊 Summary Statistics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {summary.totalPopulation && (
                <div><strong>Total Population:</strong> {summary.totalPopulation.toLocaleString()}</div>
              )}
              {summary.avgMedianIncome && (
                <div><strong>Avg Median Income:</strong> ${summary.avgMedianIncome.toLocaleString()}</div>
              )}
              {summary.avgUnemploymentRate && (
                <div><strong>Avg Unemployment:</strong> {summary.avgUnemploymentRate}%</div>
              )}
              <div><strong>Total Blocks:</strong> {summary.totalBlocks}</div>
            </div>
          </div>
        )}
        
        <div className="max-h-48 overflow-y-auto">
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            {censusBlocks.slice(0, 10).map((block: CensusBlock) => (
              <li key={block.id} className="text-xs">
                <strong>Block {block.block}</strong> (Tract {block.tract})
                {block.totalPopulation && (
                  <span className="text-gray-600"> • Pop: {block.totalPopulation.toLocaleString()}</span>
                )}
                {block.medianHouseholdIncome && (
                  <span className="text-gray-600"> • Income: ${block.medianHouseholdIncome.toLocaleString()}</span>
                )}
              </li>
            ))}
            {censusBlocks.length > 10 && (
              <li className="text-gray-500 italic">
                ...and {censusBlocks.length - 10} more census blocks
              </li>
            )}
          </ul>
        </div>
        
        <div className="text-xs text-blue-500">
          The boundaries for these census blocks are now displayed on the map.
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 text-sm">
          Error fetching NYC census data. Please try again.
        </div>
      </div>
    );
  }

  return null;
};