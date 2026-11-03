import { NextRequest, NextResponse } from 'next/server';
import { recordSimulatedOutreach } from '@/lib/db/repository';
import { ContactChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, channel, messageContent, emailSubject, staffEdited, staffName } = body as {
      taskId: string;
      channel: ContactChannel;
      messageContent: string;
      emailSubject?: string;
      staffEdited?: boolean;
      staffName?: string;
    };

    if (!taskId || !channel || !messageContent) {
      return NextResponse.json(
        { success: false, error: 'taskId, channel, and messageContent are required' },
        { status: 400 }
      );
    }

    const result = recordSimulatedOutreach(taskId, {
      taskId,
      channel,
      messageContent,
      emailSubject,
      staffEdited: Boolean(staffEdited),
      staffName: staffName || 'Clinic Staff',
    });

    return NextResponse.json({
      simulationNotice: 'Simulated outreach only: no real SMS or email was transmitted.',
      ...result,
    });
  } catch (error: any) {
    console.error('Error approving simulated outreach:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record simulated outreach' },
      { status: 500 }
    );
  }
}
