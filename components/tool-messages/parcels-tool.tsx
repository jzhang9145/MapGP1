import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ParcelsToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const ParcelsTool = ({ state, input, output }: ParcelsToolProps) => {
  const [open, setOpen] = useState(false);
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg">
          <div className="size-4 rounded-full bg-indigo-200 animate-pulse" />
          <div className="text-indigo-600 text-sm">
            Searching parcels...
            {input?.neighborhood && ` in ${input.neighborhood}`}
            {input?.borough && `, borough: ${input.borough}`}
            {input?.zoningDistrict && `, zoning: ${input.zoningDistrict}`}
            {input?.landUse && `, land use: ${input.landUse}`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="text-red-600 text-sm font-medium">
          ❌ Parcels query failed
        </div>
        <div className="text-red-500 text-sm mt-1">
          {output?.error || 'Unable to fetch parcels at this time.'}
        </div>
      </div>
    );
  }

  if (state === 'output-available' && output) {
    const { query, totalResults, results } = output;
    const rows = Array.isArray(results) ? results : [];

    return (
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-start gap-3">
          <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm">🏢</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-indigo-800 font-medium text-sm">Parcels</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const headers = [
                      'BBL',
                      'Address',
                      'Borough',
                      'LandUse',
                      'BuildingClass',
                      'Zoning',
                      'LotArea',
                      'LotFront',
                      'LotDepth',
                      'BldgArea',
                      'Floors',
                      'YearBuilt',
                      'ResFAR',
                      'CommFAR',
                      'Assessment',
                      'Owner',
                      'OwnerType',
                      'CouncilDistrict',
                      'CommunityDistrict',
                    ];
                    const data = rows.map((r: any) => [
                      r.bbl ?? '',
                      r.address ?? '',
                      r.borough ?? '',
                      r.landUse ?? '',
                      r.buildingClass ?? '',
                      r.zoningDistrict ?? '',
                      r.lotArea ?? '',
                      r.lotFront ?? '',
                      r.lotDepth ?? '',
                      r.bldgArea ?? '',
                      r.numFloors ?? '',
                      r.yearBuilt ?? '',
                      r.resFAR ?? '',
                      r.commFAR ?? '',
                      r.assessTot ?? '',
                      r.ownerName ?? '',
                      r.ownerType ?? '',
                      r.councilDistrict ?? '',
                      r.communityDistrict ?? '',
                    ]);
                    const csv = [headers, ...data]
                      .map((line) =>
                        line
                          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                          .join(','),
                      )
                      .join('\n');
                    const blob = new Blob([csv], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'parcels.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download CSV
                </Button>
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm">View all</Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[95vw] sm:w-[92vw] md:w-[90vw] lg:w-[85vw] px-2"
                  >
                    <SheetHeader>
                      <SheetTitle>All Parcels ({totalResults})</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 overflow-auto max-h-[75vh]">
                      <table className="text-xs min-w-max w-full">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-3">BBL</th>
                            <th className="py-2 pr-3">Address</th>
                            <th className="py-2 pr-3">Borough</th>
                            <th className="py-2 pr-3">Land Use</th>
                            <th className="py-2 pr-3">Class</th>
                            <th className="py-2 pr-3">Zoning</th>
                            <th className="py-2 pr-3 text-right">Lot Area</th>
                            <th className="py-2 pr-3 text-right">Lot Front</th>
                            <th className="py-2 pr-3 text-right">Lot Depth</th>
                            <th className="py-2 pr-3 text-right">Bldg Area</th>
                            <th className="py-2 pr-3 text-right">Floors</th>
                            <th className="py-2 pr-3 text-right">Year Built</th>
                            <th className="py-2 pr-3 text-right">Res FAR</th>
                            <th className="py-2 pr-3 text-right">Comm FAR</th>
                            <th className="py-2 pr-3 text-right">Assessment</th>
                            <th className="py-2 pr-3">Owner</th>
                            <th className="py-2 pr-3">Owner Type</th>
                            <th className="py-2 pr-3 text-right">
                              Council Dist
                            </th>
                            <th className="py-2 pr-0 text-right">
                              Community Dist
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r: any, i: number) => (
                            <tr
                              key={r.bbl || i}
                              className="border-b last:border-b-0"
                            >
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.bbl ?? ''}
                              </td>
                              <td className="py-2 pr-3">{r.address ?? ''}</td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.borough ?? ''}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.landUse ?? ''}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.buildingClass ?? ''}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.zoningDistrict ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.lotArea?.toLocaleString?.() ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.lotFront ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.lotDepth ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.bldgArea?.toLocaleString?.() ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.numFloors ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.yearBuilt ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.resFAR ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.commFAR ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.assessTot
                                  ? `$${r.assessTot.toLocaleString()}`
                                  : ''}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.ownerName ?? ''}
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {r.ownerType ?? ''}
                              </td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap">
                                {r.councilDistrict ?? ''}
                              </td>
                              <td className="py-2 pr-0 text-right whitespace-nowrap">
                                {r.communityDistrict ?? ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="text-indigo-700 text-sm mb-3">
              <strong>Query:</strong> {query} | <strong>Results:</strong>{' '}
              {totalResults}
              <div className="text-xs text-indigo-600 mt-1">
                Polygons are rendered on the map.
              </div>
            </div>

            {Array.isArray(results) && results.length > 0 && (
              <div className="space-y-2">
                {results.slice(0, 5).map((r: any, i: number) => (
                  <div
                    key={r.bbl || i}
                    className="bg-white p-3 rounded border border-indigo-100 text-sm"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {r.address || `BBL ${r.bbl}`}
                    </div>
                    <div className="text-gray-600 text-xs space-y-1">
                      <div>
                        {r.borough && <span>📍 {r.borough}</span>}
                        {r.landUse && (
                          <span className="ml-2">🏷️ Land Use: {r.landUse}</span>
                        )}
                        {r.buildingClass && (
                          <span className="ml-2">
                            🏗️ Class: {r.buildingClass}
                          </span>
                        )}
                        {r.zoningDistrict && (
                          <span className="ml-2">
                            🧭 Zoning: {r.zoningDistrict}
                          </span>
                        )}
                      </div>
                      <div>
                        {r.lotArea && (
                          <span>
                            📐 Lot: {r.lotArea.toLocaleString()} sq ft
                          </span>
                        )}
                        {r.lotFront && (
                          <span className="ml-2">↔️ Front: {r.lotFront}</span>
                        )}
                        {r.lotDepth && (
                          <span className="ml-2">↕️ Depth: {r.lotDepth}</span>
                        )}
                        {r.bldgArea && (
                          <span className="ml-2">
                            🏢 Bldg: {r.bldgArea.toLocaleString()} sq ft
                          </span>
                        )}
                        {r.assessTot && (
                          <span className="ml-2">
                            💰 ${r.assessTot.toLocaleString()}
                          </span>
                        )}
                        {r.yearBuilt && (
                          <span className="ml-2">📅 {r.yearBuilt}</span>
                        )}
                        {r.numFloors && (
                          <span className="ml-2">⬆️ {r.numFloors} floors</span>
                        )}
                        {r.resFAR && (
                          <span className="ml-2">🏠 Res FAR: {r.resFAR}</span>
                        )}
                        {r.commFAR && (
                          <span className="ml-2">🏢 Comm FAR: {r.commFAR}</span>
                        )}
                      </div>
                      {(r.ownerName ||
                        r.ownerType ||
                        r.councilDistrict ||
                        r.communityDistrict) && (
                        <div>
                          {r.ownerName && <span>👤 {r.ownerName}</span>}
                          {r.ownerType && (
                            <span className="ml-2">🏛️ {r.ownerType}</span>
                          )}
                          {r.councilDistrict && (
                            <span className="ml-2">
                              🗳️ CD {r.councilDistrict}
                            </span>
                          )}
                          {r.communityDistrict && (
                            <span className="ml-2">
                              📍 Comm Dist {r.communityDistrict}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {results.length > 5 && (
                  <div className="text-indigo-600 text-xs text-center py-1">
                    + {results.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
