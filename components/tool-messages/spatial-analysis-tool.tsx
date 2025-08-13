interface SpatialAnalysisToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const SpatialAnalysisTool = ({
  toolCallId,
  state,
  input,
  output,
}: SpatialAnalysisToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg">
          <div className="size-4 rounded-full bg-indigo-200 animate-pulse" />
          <div className="text-indigo-600 text-sm">
            Performing spatial analysis...
            {input?.query && ` "${input.query}"`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 text-sm font-medium">
          ❌ Spatial analysis failed
        </div>
        <div className="text-red-500 text-sm mt-1">
          {output?.error || 'Unable to perform spatial analysis at this time.'}
        </div>
      </div>
    );
  }

  if (state === 'output-available' && output) {
    const { 
      query, 
      primaryLayer, 
      filterDescription, 
      spatialRelation, 
      resultCount, 
      results, 
      summary, 
      message 
    } = output;

    // Map layer names to icons
    const layerIcons: Record<string, string> = {
      parks: '🏞️',
      neighborhoods: '🏘️',
      schoolZones: '🏫',
    };

    const layerNames: Record<string, string> = {
      parks: 'Parks',
      neighborhoods: 'Neighborhoods', 
      schoolZones: 'School Zones',
    };

    return (
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-start gap-3">
          <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm">🗺️</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-indigo-800 font-medium text-sm mb-2">
              Spatial Analysis Results
            </div>
            
            <div className="text-indigo-700 text-sm mb-3">
              <strong>Query:</strong> {query}
            </div>

            <div className="text-indigo-700 text-sm mb-3">
              {message}
            </div>

            {results && results.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-indigo-800 font-medium">
                  {layerIcons[primaryLayer]} {layerNames[primaryLayer]} Found ({resultCount})
                </div>
                
                <div className="grid gap-2">
                  {results.slice(0, 5).map((result: any, index: number) => (
                    <div
                      key={result.id || index}
                      className="bg-white p-3 rounded border border-indigo-100 text-sm"
                    >
                      <div className="font-medium text-gray-900 mb-1">
                        {primaryLayer === 'parks' && (result.name || result.signname || 'Unnamed Park')}
                        {primaryLayer === 'neighborhoods' && result.name}
                        {primaryLayer === 'schoolZones' && (result.schoolName || result.dbn || result.label)}
                      </div>
                      
                      <div className="space-y-1 text-gray-600">
                        {primaryLayer === 'parks' && (
                          <>
                            {result.borough && (
                              <div>📍 {getBoroughDisplayName(result.borough)}</div>
                            )}
                            {result.address && (
                              <div>🏠 {result.address}</div>
                            )}
                            {result.acreage && (
                              <div>📏 {result.acreage} acres</div>
                            )}
                            {result.typecategory && (
                              <div>🏷️ {result.typecategory}</div>
                            )}
                          </>
                        )}
                        
                        {primaryLayer === 'neighborhoods' && (
                          <>
                            {result.borough && (
                              <div>📍 {result.borough}</div>
                            )}
                          </>
                        )}
                        
                        {primaryLayer === 'schoolZones' && (
                          <>
                            {result.dbn && (
                              <div>🏫 DBN: {result.dbn}</div>
                            )}
                            {result.borough && (
                              <div>📍 {getBoroughDisplayName(result.borough)}</div>
                            )}
                            {result.schoolDistrict && (
                              <div>🏫 District: {result.schoolDistrict}</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {results.length > 5 && (
                    <div className="text-indigo-600 text-xs text-center py-2">
                      + {results.length - 5} more results
                      <span className="block mt-1">
                        All results with boundary data are displayed on the map
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!results || results.length === 0) && (
              <div className="text-indigo-600 text-sm">
                No spatial matches found for your query.
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
    'B': 'Brooklyn',
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