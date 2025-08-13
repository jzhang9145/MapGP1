import type { ParksResponse } from '@/lib/schemas';

interface NYCParksToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: ParksResponse;
}

export const NYCParksTool = ({
  toolCallId,
  state,
  input,
  output,
}: NYCParksToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
          <div className="size-4 rounded-full bg-green-200 animate-pulse" />
          <div className="text-green-600 text-sm">
            Fetching NYC parks data...
            {input?.borough && ` for ${getBoroughDisplayName(input.borough)}`}
            {input?.searchTerm && ` matching "${input.searchTerm}"`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 text-sm font-medium">
          ❌ Error fetching parks data
        </div>
        <div className="text-red-500 text-sm mt-1">
          Unable to retrieve NYC parks information at this time.
        </div>
      </div>
    );
  }

  if (state === 'output-available' && output) {
    const { parks, totalCount, searchTerm, borough, message } = output;

    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <div className="size-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm">🏞️</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-green-800 font-medium text-sm mb-2">
              NYC Parks Search Results
            </div>
            
            <div className="text-green-700 text-sm mb-3">
              {message}
            </div>

            {parks.length > 0 && (
              <div className="space-y-3">
                {parks.slice(0, 5).map((park) => (
                  <div
                    key={park.id}
                    className="bg-white p-3 rounded border border-green-100 text-sm"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {park.name || park.signname || 'Unnamed Park'}
                      {park.signname && park.signname !== park.name && (
                        <span className="text-gray-500 font-normal ml-1">
                          ({park.signname})
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-gray-600">
                      {park.borough && (
                        <div>
                          📍 {getBoroughDisplayName(park.borough)}
                        </div>
                      )}
                      
                      {park.address && (
                        <div>🏠 {park.address}</div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs">
                        {park.acreage && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            📏 {park.acreage} acres
                          </span>
                        )}
                        
                        {park.typecategory && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            🏷️ {park.typecategory}
                          </span>
                        )}
                        
                        {park.waterfront === 'Y' && (
                          <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                            🌊 Waterfront
                          </span>
                        )}
                      </div>
                      
                      {park.department && (
                        <div className="text-xs text-gray-500">
                          Managed by: {park.department}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {parks.length > 5 && (
                  <div className="text-green-600 text-xs text-center py-2">
                    + {parks.length - 5} more parks
                    {parks.filter(p => p.geojson).length > 0 && (
                      <span className="block mt-1">
                        Parks with boundary data are displayed on the map
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {parks.length === 0 && (
              <div className="text-green-600 text-sm">
                No parks found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Helper function to convert borough codes to display names
function getBoroughDisplayName(borough: string): string {
  const boroughMap: Record<string, string> = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island',
    'M': 'Manhattan',
    'X': 'Bronx',
    'K': 'Brooklyn',
    'Q': 'Queens',
    'R': 'Staten Island',
    'Manhattan': 'Manhattan',
    'Bronx': 'Bronx',
    'Brooklyn': 'Brooklyn',
    'Queens': 'Queens',
    'Staten Island': 'Staten Island',
  };
  
  return boroughMap[borough] || borough;
}