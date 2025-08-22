import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTimeSlots } from '../../../../lib/calendar.js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const timeSlots = await getAvailableTimeSlots(date);

    return NextResponse.json({
      success: true,
      date: dateParam,
      slots: timeSlots
    });

  } catch (error) {
    console.error('Error fetching calendar slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar slots' },
      { status: 500 }
    );
  }
}