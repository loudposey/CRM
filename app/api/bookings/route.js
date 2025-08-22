import { NextResponse } from 'next/server';
import { createBooking } from '../../../src/lib/booking.js';
import { createBookingSupabase, initializeDatabase } from '../../../src/lib/booking-supabase.js';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Try Supabase first, fall back to original method
    const result = await createBookingSupabase(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        booking: result.booking,
        message: 'Meeting scheduled successfully!'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          errors: result.errors || []
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Use Supabase to initialize database
    const result = await initializeDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}