import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getAreaByChatId, getChatById } from '@/lib/db/queries';
import { isUUID } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;

    if (!chatId || !isUUID(chatId)) {
      return NextResponse.json(
        { error: 'Chat ID is invalid' },
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
