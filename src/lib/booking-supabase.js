import { supabase } from './supabase.js';
import { createZoomMeeting } from './zoom.js';

// Initialize the bookings table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Create the bookings table using Supabase SQL
    const { error } = await supabase.rpc('create_bookings_table_if_not_exists');
    
    if (error && !error.message.includes('already exists')) {
      // If the RPC doesn't exist, create table directly
      const { error: createError } = await supabase
        .from('bookings')
        .select('id')
        .limit(1);
      
      if (createError && createError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it via SQL
        throw new Error('Table needs to be created in Supabase dashboard');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Create a booking using Supabase client with Zoom integration
export async function createBookingSupabase(bookingData) {
  try {
    const {
      attendee_email,
      attendee_phone,
      meeting_datetime,
      duration_minutes = 30,
      recording_consent = false
    } = bookingData;

    console.log('Creating booking with Zoom integration...');

    // Step 1: Create Zoom meeting
    let zoomMeeting = null;
    try {
      console.log('Attempting to create Zoom meeting...');
      const zoomResult = await createZoomMeeting(bookingData);
      
      if (zoomResult.success) {
        zoomMeeting = zoomResult.meeting;
        console.log('Zoom meeting created successfully:', zoomMeeting.id);
      } else {
        console.warn('Zoom meeting creation failed:', zoomResult.error);
        // Continue with booking creation even if Zoom fails
      }
    } catch (zoomError) {
      console.warn('Zoom integration error (continuing without Zoom):', zoomError.message);
      // Don't fail the entire booking if Zoom fails
    }

    // Step 2: Insert the booking with Zoom details
    const bookingRecord = {
      attendee_email,
      attendee_phone,
      meeting_datetime,
      duration_minutes,
      recording_consent,
      status: 'confirmed',
      // Add Zoom meeting details if available
      zoom_meeting_id: zoomMeeting?.id || null,
      zoom_join_url: zoomMeeting?.join_url || null
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // If booking fails but Zoom meeting was created, we should clean up
      if (zoomMeeting?.id) {
        console.log('Cleaning up Zoom meeting due to booking failure...');
        // Note: You might want to implement cleanup here
      }
      
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }

    console.log('Booking created successfully with ID:', data.id);

    return {
      success: true,
      booking: {
        ...data,
        // Include Zoom meeting details in response
        zoom_meeting: zoomMeeting ? {
          join_url: zoomMeeting.join_url,
          password: zoomMeeting.password,
          meeting_id: zoomMeeting.id
        } : null
      }
    };

  } catch (error) {
    console.error('Booking creation error:', error);
    return { 
      success: false, 
      error: `Booking creation failed: ${error.message}` 
    };
  }
}