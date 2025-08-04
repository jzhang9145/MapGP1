import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { getAreaByChatId, createArea, updateArea } from '@/lib/db/queries';
import type { ChatMessage } from '@/lib/types';
import type { Session } from 'next-auth';

interface UpdateAreaToolProps {
  chatId: string;
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const updateAreaTool = ({
  chatId,
  session,
  dataStream,
}: UpdateAreaToolProps) =>
  tool({
    description:
      'Update the geographic area associated with a chat. This tool can modify the area name, summary, and geographic data (GeoJSON). The tool stores GeoJSON data separately and returns a reference ID to reduce AI context size.',
    inputSchema: z.object({
      name: z
        .string()
        .optional()
        .describe('The new name for the area (optional)'),
      summary: z
        .string()
        .optional()
        .describe('The new summary description for the area (optional)'),
      geojsonDataId: z
        .any()
        .optional()
        .describe(
          'GeoData JSON ID reference to the new GeoJSON data for the area (optional). Can be a Point, Polygon, MultiPolygon, Feature, or FeatureCollection. This data will be stored separately and referenced by ID.',
        ),
    }),
    execute: async ({ name, summary, geojsonDataId }) => {
      console.log('updateAreaTool', { name, summary, geojsonDataId });
      try {
        // Check if area exists
        const existingArea = await getAreaByChatId({ chatId });

        if (!existingArea) {
          // Create new area if it doesn't exist
          if (!name || !summary || !geojsonDataId) {
            return {
              error:
                'Area does not exist. To create a new area, all fields (name, summary, geojson) are required.',
            };
          }

          const newArea = await createArea({
            chatId,
            name,
            summary,
            geojsonDataId,
          });

          return {
            success: true,
            action: 'created',
            area: newArea[0],
            message: `Successfully created new area "${name}" for this chat.`,
          };
        } else {
          // Update existing area
          const updatedName = name || existingArea.name;
          const updatedSummary = summary || existingArea.summary;
          const updatedGeojson = geojsonDataId || existingArea.geojsonDataId;

          const updateReq = {
            chatId,
            name: updatedName,
            summary: updatedSummary,
            geojsonDataId: updatedGeojson,
          };
          console.log('updateReq', updateReq);

          const updatedArea = await updateArea(updateReq);

          return {
            success: true,
            action: 'updated',
            area: updatedArea[0],
            message: `Successfully updated area "${updatedArea[0].name}" for this chat.`,
          };
        }
      } catch (error) {
        console.error('Error updating area:', error);
        return {
          error:
            'Failed to update area. Please check the provided data and try again.',
        };
      }
    },
  });
