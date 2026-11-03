import { NextRequest, NextResponse } from 'next/server';
import { getFollowUpTasks } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || undefined;
    const tierFilter = (searchParams.get('tier') as any) || 'all';
    const providerFilter = searchParams.get('provider') || undefined;
    const categoryFilter = searchParams.get('category') || undefined;

    const result = getFollowUpTasks({
      searchQuery,
      tierFilter,
      providerFilter,
      categoryFilter,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
