import { NextRequest, NextResponse } from 'next/server';
import { getDailyOperationalSummary } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date') || '2026-11-03';

    const summary = getDailyOperationalSummary(dateParam);

    return NextResponse.json({
      success: true,
      simulationNotice: 'All outreach metrics represent simulated staff approval and clipboard dispatch. No real external telephony or SMS messages were transmitted.',
      summary,
    });
  } catch (error: any) {
    console.error('Error generating operational summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
