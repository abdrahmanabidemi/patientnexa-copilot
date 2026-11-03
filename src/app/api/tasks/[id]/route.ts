import { NextRequest, NextResponse } from 'next/server';
import { getTaskAuditLogs, getTaskById, getTaskOutcomes } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = getTaskById(params.id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const outcomes = getTaskOutcomes(params.id);
    const auditLogs = getTaskAuditLogs(params.id);

    return NextResponse.json({
      success: true,
      task,
      outcomes,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Error fetching task details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
