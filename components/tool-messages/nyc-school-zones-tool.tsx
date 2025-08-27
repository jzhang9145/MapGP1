import type { SchoolZonesResponse } from '@/lib/schemas';

interface NYCSchoolZonesToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: SchoolZonesResponse;
}

export const NYCSchoolZonesTool = ({
  toolCallId,
  state,
  input,
  output,
}: NYCSchoolZonesToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
          <div className="size-4 rounded-full bg-purple-200 animate-pulse" />
          <div className="text-purple-600 text-sm">
            Fetching NYC elementary school zones...
            {input?.borough && ` for ${getBoroughName(input.borough)}`}
            {input?.district && ` in District ${input.district}`}
            {input?.searchTerm && ` matching "${input.searchTerm}"`}
            {input?.dbn && ` for ${input.dbn}`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    const zones = output?.zones || [];
    const totalResults = output?.totalResults || 0;

    return (
      <div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-4 rounded-full bg-purple-500" />
            <div className="text-purple-700 font-medium">
              NYC Elementary School Zones
            </div>
          </div>
          
          <div className="text-purple-600 text-sm mb-3">
            {output?.message || `Found ${totalResults} school zone${totalResults === 1 ? '' : 's'}`}
          </div>

          {zones.length > 0 && (
            <div className="space-y-3">
              {zones.slice(0, 5).map((zone, index) => (
                <div key={zone.id || index} className="bg-white p-3 rounded border border-purple-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-purple-800">
                        {zone.dbn}
                        {zone.schoolName && ` - ${zone.schoolName}`}
                      </div>
                      <div className="text-sm text-purple-600">
                        {zone.label}
                      </div>
                    </div>
                    <div className="text-xs text-purple-500">
                      District {zone.schoolDistrict}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-xs text-purple-600">
                    <span>Borough: {getBoroughName(zone.borough)}</span>
                    {zone.shapeArea && (
                      <span>Area: {Number.parseFloat(zone.shapeArea).toLocaleString()} sq ft</span>
                    )}
                  </div>
                  
                  {zone.remarks && (
                    <div className="mt-2 text-xs text-purple-600 bg-purple-25 p-2 rounded">
                      <strong>Notes:</strong> {zone.remarks}
                    </div>
                  )}
                  
                  {zone.geojson && (
                    <div className="mt-2 text-xs text-purple-500">
                      ✓ Boundary data available for map visualization
                    </div>
                  )}
                </div>
              ))}
              
              {zones.length > 5 && (
                <div className="text-xs text-purple-500 text-center py-2">
                  Showing 5 of {zones.length} school zones
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
        Error fetching NYC school zones: {String(output || 'Unknown error')}
      </div>
    );
  }

  return null;
};

// Helper function to convert borough codes to names
function getBoroughName(borough: string): string {
  const boroughMap: Record<string, string> = {
    K: 'Brooklyn',
    M: 'Manhattan', 
    Q: 'Queens',
    X: 'Bronx',
    R: 'Staten Island',
  };
  return boroughMap[borough?.toUpperCase()] || borough;
}