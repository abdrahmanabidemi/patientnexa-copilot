import { NextResponse } from 'next/server';
import { resetDemoCohort } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = resetDemoCohort();
    return NextResponse.json({
      success: true,
      message: 'Demo dataset reset successfully',
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error resetting demo database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset demo data' },
      { status: 500 }
    );
  }
}
