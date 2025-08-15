import type { MapPLUTOResponse, MapPLUTOProperty } from '@/lib/schemas/mappluto';
import { getPropertyDescription, getPropertyIcon, formatAssessment, formatArea } from '@/lib/schemas/mappluto';

interface MapPLUTOToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: MapPLUTOResponse;
}

export const MapPLUTOTool = ({
  toolCallId,
  state,
  input,
  output,
}: MapPLUTOToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
          <div className="size-4 rounded-full bg-purple-200 animate-pulse" />
          <div className="text-purple-600 text-sm">
            Searching NYC properties...
            {input?.searchTerm && ` for "${input.searchTerm}"`}
            {input?.buildingClass && ` (${input.buildingClass})`}
            {input?.minAssessment && ` over ${formatAssessment(input.minAssessment)}`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available' && output?.properties) {
    const properties = output.properties;
    const summary = output.summary;
    
    return (
      <div className="flex flex-col gap-4 p-4 bg-purple-50 rounded-lg">
        <div className="text-purple-600 text-sm font-semibold">
          Found {properties.length} Propert{properties.length !== 1 ? 'ies' : 'y'}:
        </div>
        
        {summary && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="font-medium text-purple-800 mb-3 flex items-center gap-2">
              🏢 Property Summary
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {summary.totalProperties && (
                <div className="bg-purple-50 rounded-md p-2">
                  <div className="text-xs text-purple-600 font-medium">Total Properties</div>
                  <div className="text-lg font-bold text-purple-800">{summary.totalProperties}</div>
                </div>
              )}
              {summary.avgAssessment && (
                <div className="bg-green-50 rounded-md p-2">
                  <div className="text-xs text-green-600 font-medium">Avg Assessment</div>
                  <div className="text-lg font-bold text-green-800">{formatAssessment(summary.avgAssessment)}</div>
                </div>
              )}
              {summary.avgLotSize && (
                <div className="bg-blue-50 rounded-md p-2">
                  <div className="text-xs text-blue-600 font-medium">Avg Lot Size</div>
                  <div className="text-lg font-bold text-blue-800">{formatArea(summary.avgLotSize)}</div>
                </div>
              )}
              {summary.avgYearBuilt && (
                <div className="bg-orange-50 rounded-md p-2">
                  <div className="text-xs text-orange-600 font-medium">Avg Year Built</div>
                  <div className="text-lg font-bold text-orange-800">{summary.avgYearBuilt}</div>
                </div>
              )}
            </div>
            
            {summary.totalAssessedValue && (
              <div className="mt-3 pt-3 border-t border-purple-100">
                <div className="text-sm">
                  <span className="font-medium text-purple-700">Total Assessed Value: </span>
                  <span className="text-xl font-bold text-green-700">{formatAssessment(summary.totalAssessedValue)}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {properties.slice(0, 12).map((property: MapPLUTOProperty) => (
            <PropertyCard key={property.id} property={property} />
          ))}
          {properties.length > 12 && (
            <div className="text-center text-purple-600 text-sm py-2 bg-purple-100 rounded-md">
              ...and {properties.length - 12} more properties
            </div>
          )}
        </div>
        
        <div className="text-xs text-purple-500 flex items-center gap-1">
          <span>🗺️</span>
          Property boundaries are displayed on the map
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 text-sm">
          Error fetching property data. Please try again.
        </div>
      </div>
    );
  }

  return null;
};

function PropertyCard({ property }: { property: MapPLUTOProperty }) {
  const propertyType = getPropertyDescription(property.bldgclass || '', property.landuse || '');
  const icon = getPropertyIcon(property.bldgclass || '', property.landuse || '');
  
  // Get primary zoning or fallback to property type
  const primaryZoning = property.zonedist1 || propertyType;
  const zoningDisplay = property.zonedist1 ? property.zonedist1 : `${propertyType} ${property.bldgclass ? `(${property.bldgclass})` : ''}`;
  
  // Determine if this is a development opportunity
  const isDevelopmentSite = property.bldgclass?.startsWith('V') || property.landuse === '29';
  const hasHighDevelopmentPotential = property.builtfar && property.residfar && 
    property.builtfar < (property.residfar * 0.6);
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">
              {property.address || `Block ${property.block}, Lot ${property.lot}`}
            </div>
            <div className="text-xs text-purple-600 font-medium">
              {zoningDisplay}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-700">
            {formatAssessment(property.assesstot)}
          </div>
          <div className="text-xs text-gray-500">BBL: {property.bbl}</div>
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {property.lotarea && (
          <div className="flex items-center gap-2">
            <span className="text-blue-500">📐</span>
            <div>
              <div className="text-xs text-gray-600">Lot Size</div>
              <div className="font-semibold text-sm">{formatArea(property.lotarea)}</div>
            </div>
          </div>
        )}
        
        {property.bldgarea && (
          <div className="flex items-center gap-2">
            <span className="text-orange-500">🏗️</span>
            <div>
              <div className="text-xs text-gray-600">Building Area</div>
              <div className="font-semibold text-sm">{formatArea(property.bldgarea)}</div>
            </div>
          </div>
        )}
        
        {property.yearbuilt && (
          <div className="flex items-center gap-2">
            <span className="text-purple-500">📅</span>
            <div>
              <div className="text-xs text-gray-600">Built</div>
              <div className="font-semibold text-sm">{property.yearbuilt}</div>
            </div>
          </div>
        )}
        
        {property.unitstotal && property.unitstotal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-green-500">🏠</span>
            <div>
              <div className="text-xs text-gray-600">Units</div>
              <div className="font-semibold text-sm">{property.unitstotal}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Development Potential */}
      {(isDevelopmentSite || hasHighDevelopmentPotential) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-600">🚀</span>
            <span className="text-xs font-semibold text-yellow-700">Development Potential</span>
          </div>
          {isDevelopmentSite && (
            <div className="text-xs text-yellow-700">Vacant development site</div>
          )}
          {hasHighDevelopmentPotential && property.residfar && property.builtfar && (
            <div className="text-xs text-yellow-700">
              Can build {(property.residfar - property.builtfar).toFixed(1)} more FAR
              ({Math.round(((property.residfar - property.builtfar) / property.residfar) * 100)}% unused)
            </div>
          )}
        </div>
      )}
      
      {/* Owner & Zoning */}
      <div className="text-xs text-gray-600 space-y-1">
        {property.ownername && (
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span className="truncate">{property.ownername}</span>
          </div>
        )}
        
        {(property.zonedist1 || property.zonedist2 || property.zonedist3 || property.zonedist4) && (
          <div className="flex items-center gap-2">
            <span>🏘️</span>
            <span>
              Zoning: {[property.zonedist1, property.zonedist2, property.zonedist3, property.zonedist4]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}
        
        {property.residfar && (
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>Max FAR: {property.residfar} {property.builtfar && `(Built: ${property.builtfar})`}</span>
          </div>
        )}
        
        {property.zipcode && (
          <div className="flex items-center gap-2">
            <span>📮</span>
            <span>ZIP: {property.zipcode}</span>
          </div>
        )}
      </div>
      
      {/* Historic/Landmark Status */}
      {(property.histdist || property.landmark) && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-500">🏛️</span>
            <span className="text-amber-700 font-medium">
              {property.landmark || property.histdist}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
