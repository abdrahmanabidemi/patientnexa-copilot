import { NextRequest, NextResponse } from 'next/server';
import { getTaskById } from '@/lib/db/repository';
import { generateOutreachDraft } from '@/lib/agent/draft-service';
import { ContactChannel, ToneModifier } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, channel = 'sms', tone = 'standard' } = body as {
      taskId: string;
      channel: ContactChannel;
      tone?: ToneModifier;
    };

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const result = await generateOutreachDraft(task, channel, tone);

    return NextResponse.json({
      success: true,
      taskId,
      channel,
      ...result,
    });
  } catch (error: any) {
    console.error('Error generating outreach draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
