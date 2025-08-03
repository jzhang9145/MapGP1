import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getAreaByChatId,
  createArea,
  updateArea,
  getChatById,
} from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      );
    }

    // Check if user has access to this chat
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.visibility === 'private' && session.user?.id !== chat.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const area = await getAreaByChatId({ chatId });
    return NextResponse.json({ area });
  } catch (error) {
    console.error('Error getting area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const body = await request.json();
    const { name, summary, geojson } = body;

    if (!chatId || !name || !summary || !geojson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if user has access to this chat
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (session.user?.id !== chat.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if area already exists
    const existingArea = await getAreaByChatId({ chatId });

    if (existingArea) {
      // Update existing area
      const updatedArea = await updateArea({
        chatId,
        name,
        summary,
        geojson,
      });
      return NextResponse.json({ area: updatedArea[0] });
    } else {
      // Create new area
      const newArea = await createArea({
        chatId,
        name,
        summary,
        geojson,
      });
      return NextResponse.json({ area: newArea[0] });
    }
  } catch (error) {
    console.error('Error creating/updating area:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
} 