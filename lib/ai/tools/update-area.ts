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
      'Update the geographic area associated with a chat. This tool can modify the area name, summary, and geographic data (GeoJSON).',
    inputSchema: z.object({
      name: z
        .string()
        .optional()
        .describe('The new name for the area (optional)'),
      summary: z
        .string()
        .optional()
        .describe('The new summary description for the area (optional)'),
      geojson: z
        .any()
        .optional()
        .describe(
          'The new GeoJSON data for the area (optional). Can be a Point, Polygon, MultiPolygon, Feature, or FeatureCollection',
        ),
    }),
    execute: async ({ name, summary, geojson }) => {
      try {
        // Check if area exists
        const existingArea = await getAreaByChatId({ chatId });

        if (!existingArea) {
          // Create new area if it doesn't exist
          if (!name || !summary || !geojson) {
            return {
              error:
                'Area does not exist. To create a new area, all fields (name, summary, geojson) are required.',
            };
          }

          const newArea = await createArea({
            chatId,
            name,
            summary,
            geojson,
          });

          return {
            success: true,
            action: 'created',
            area: {
              chatId: newArea[0].chatId,
              name: newArea[0].name,
              summary: newArea[0].summary,
              geojson: newArea[0].geojson,
            },
            message: `Successfully created new area "${name}" for this chat.`,
          };
        } else {
          // Update existing area
          const updatedName = name || existingArea.name;
          const updatedSummary = summary || existingArea.summary;
          const updatedGeojson = geojson || existingArea.geojson;

          const updatedArea = await updateArea({
            chatId,
            name: updatedName,
            summary: updatedSummary,
            geojson: updatedGeojson,
          });

          return {
            success: true,
            action: 'updated',
            area: {
              chatId: updatedArea[0].chatId,
              name: updatedArea[0].name,
              summary: updatedArea[0].summary,
              geojson: updatedArea[0].geojson,
            },
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
