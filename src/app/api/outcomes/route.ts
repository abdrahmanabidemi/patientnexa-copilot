import { NextRequest, NextResponse } from 'next/server';
import { recordOutcome } from '@/lib/db/repository';
import { OutcomeType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_OUTCOMES: OutcomeType[] = [
  'contacted',
  'no_response',
  'appointment_scheduled',
  'declined',
  'follow_up_needed',
  'unable_to_reach',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, outcomeType, scheduledAppointmentAt, staffNotes, staffName } = body as {
      taskId: string;
      outcomeType: OutcomeType;
      scheduledAppointmentAt?: string;
      staffNotes?: string;
      staffName?: string;
    };

    if (!taskId || !outcomeType) {
      return NextResponse.json(
        { success: false, error: 'taskId and outcomeType are required' },
        { status: 400 }
      );
    }

    if (!VALID_OUTCOMES.includes(outcomeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid outcomeType. Must be one of: ${VALID_OUTCOMES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = recordOutcome(taskId, {
      outcomeType,
      scheduledAppointmentAt,
      staffNotes,
      staffName: staffName || 'Clinic Staff',
    });

    return NextResponse.json({
      message: 'Outcome successfully recorded in SQLite database',
      ...result,
    });
  } catch (error: any) {
    console.error('Error recording outcome:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record outcome' },
      { status: 500 }
    );
  }
}
