import { NextRequest, NextResponse } from 'next/server';
import { getMapPLUTOWithGeoJSON } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { geojsonDataIds } = await req.json();

    if (!geojsonDataIds || !Array.isArray(geojsonDataIds)) {
      return NextResponse.json(
        { error: 'geojsonDataIds array is required' },
        { status: 400 }
      );
    }

    const properties = await getMapPLUTOWithGeoJSON({ geojsonDataIds });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching MapPLUTO GeoJSON data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MapPLUTO GeoJSON data' },
      { status: 500 }
    );
  }
}
