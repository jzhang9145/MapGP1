import type { NextRequest } from 'next/server';
import { getGeoJSONDataById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    const record = (await getGeoJSONDataById({ id })) as any;
    const data = Array.isArray(record) ? record[0]?.data : record?.data;
    if (!data) {
      return new ChatSDKError('not_found:api').toResponse();
    }
    return Response.json({ geojson: data });
  } catch (_e) {
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
