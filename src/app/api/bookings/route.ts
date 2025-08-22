import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '../../../lib/booking.js';
import { sql } from '@vercel/postgres';

interface BookingResult {
  success: boolean;
  booking?: object;
  error?: string;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await createBooking(body) as BookingResult;

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
    // Create the bookings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        attendee_email VARCHAR(255) NOT NULL,
        attendee_phone VARCHAR(50),
        meeting_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        recording_consent BOOLEAN DEFAULT false,
        zoom_meeting_id VARCHAR(255),
        zoom_join_url TEXT,
        google_event_id VARCHAR(255),
        attendee_google_event_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(meeting_datetime)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(attendee_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}