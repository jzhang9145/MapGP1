import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createArea, getAreaByChatId, updateArea } from '@/lib/db/queries';

describe('Area Migration Tests', () => {
  const testChatId = `test-chat-id-${Date.now()}`;
  const testGeojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-74.006, 40.7128],
    },
    properties: {
      name: 'Test Area',
    },
  };

  beforeAll(async () => {
    // Clean up any existing test data
    // This would normally be done in a test database
  });

  afterAll(async () => {
    // Clean up test data
    // This would normally be done in a test database
  });

  it('should create area with geojson data in new schema', async () => {
    const areaData = {
      chatId: testChatId,
      name: 'Test Area',
      summary: 'A test area for migration testing',
      geojson: testGeojson,
    };

    const result = await createArea(areaData);

    expect(result).toBeDefined();
    expect(result[0]).toHaveProperty('chatId', testChatId);
    expect(result[0]).toHaveProperty('name', 'Test Area');
    expect(result[0]).toHaveProperty(
      'summary',
      'A test area for migration testing',
    );
    expect(result[0]).toHaveProperty('geojsonDataId');
    expect(result[0].geojsonDataId).toBeDefined();
  });

  it('should retrieve area with geojson data from new schema', async () => {
    const area = await getAreaByChatId({ chatId: testChatId });

    expect(area).toBeDefined();
    expect(area).toHaveProperty('chatId', testChatId);
    expect(area).toHaveProperty('name', 'Test Area');
    expect(area).toHaveProperty('summary', 'A test area for migration testing');
    expect(area).toHaveProperty('geojsonDataId');
    expect(area).toHaveProperty('geojson');
    expect(area.geojson).toEqual(testGeojson);
  });

  it('should update area with new geojson data', async () => {
    const updatedGeojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-73.935242, 40.73061],
      },
      properties: {
        name: 'Updated Test Area',
      },
    };

    const result = await updateArea({
      chatId: testChatId,
      name: 'Updated Test Area',
      summary: 'An updated test area',
      geojson: updatedGeojson,
    });

    expect(result).toBeDefined();
    expect(result[0]).toHaveProperty('name', 'Updated Test Area');
    expect(result[0]).toHaveProperty('summary', 'An updated test area');

    // Verify the update was successful
    const updatedArea = await getAreaByChatId({ chatId: testChatId });
    expect(updatedArea).toHaveProperty('name', 'Updated Test Area');
    expect(updatedArea).toHaveProperty('summary', 'An updated test area');
    expect(updatedArea.geojson).toEqual(updatedGeojson);
  });
});
