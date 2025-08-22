const { sql } = require('@vercel/postgres');
const { google } = require('googleapis');

/**
 * Validate a booking request
 * @param {Object} request - The booking request object
 * @returns {Object} Validation result with isValid and errors
 */
function validateBookingRequest(request) {
  const errors = [];

  // Check required fields
  if (!request.attendee_email) {
    errors.push('Email address is required');
  }

  if (!request.meeting_datetime) {
    errors.push('Meeting date and time is required');
  }

  if (request.recording_consent === undefined || request.recording_consent === null) {
    errors.push('Recording consent is required');
  }

  // Validate email format
  if (request.attendee_email && !isValidEmail(request.attendee_email)) {
    errors.push('Invalid email address');
  }

  // Validate meeting time
  if (request.meeting_datetime) {
    const meetingTime = new Date(request.meeting_datetime);
    
    // Check if time is in the past
    if (meetingTime <= new Date()) {
      errors.push('Meeting time cannot be in the past');
    }

    // Check business hours (9 AM - 5 PM)
    const hour = meetingTime.getHours();
    if (hour < 9 || hour >= 17) {
      errors.push('Meeting time must be during business hours (9 AM - 5 PM)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a new booking
 * @param {Object} bookingRequest - The booking request
 * @returns {Object} Creation result
 */
async function createBooking(bookingRequest) {
  try {
    // Validate the request first
    const validation = validateBookingRequest(bookingRequest);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      };
    }

    // Create the booking in the database
    const bookingResult = await sql`
      INSERT INTO bookings (
        attendee_email,
        attendee_phone,
        meeting_datetime,
        recording_consent,
        status
      ) VALUES (
        ${bookingRequest.attendee_email},
        ${bookingRequest.attendee_phone || null},
        ${bookingRequest.meeting_datetime},
        ${bookingRequest.recording_consent},
        'confirmed'
      )
      RETURNING *
    `;

    const booking = bookingResult.rows[0];

    // Create Google Calendar event
    try {
      const calendarEventId = await createCalendarEvent(booking);
      
      // Update booking with calendar event ID
      await sql`
        UPDATE bookings 
        SET google_event_id = ${calendarEventId}
        WHERE id = ${booking.id}
      `;

      booking.google_event_id = calendarEventId;
    } catch (calendarError) {
      console.error('Calendar event creation failed:', calendarError);
      // Don't fail the entire booking for calendar errors
      return {
        success: false,
        error: 'Calendar event creation failed: ' + calendarError.message
      };
    }

    return {
      success: true,
      booking
    };

  } catch (error) {
    console.error('Booking creation failed:', error);
    return {
      success: false,
      error: 'Database error: ' + error.message
    };
  }
}

/**
 * Create a Google Calendar event for the booking
 * @param {Object} booking - The booking object
 * @returns {string} Calendar event ID
 */
async function createCalendarEvent(booking) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL || 'http://localhost:3001/api/auth/callback/google'
  );

  // In production, this would use actual OAuth tokens
  // For now, we'll simulate the API call
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const meetingTime = new Date(booking.meeting_datetime);
  const endTime = new Date(meetingTime.getTime() + 30 * 60 * 1000); // 30 minutes later

  const event = {
    summary: 'Meeting with ' + booking.attendee_email,
    description: `
Meeting scheduled via booking system.
Attendee: ${booking.attendee_email}
Phone: ${booking.attendee_phone || 'Not provided'}
Recording consent: ${booking.recording_consent ? 'Yes' : 'No'}
    `.trim(),
    start: {
      dateTime: meetingTime.toISOString(),
      timeZone: 'America/Los_Angeles', // This should be configurable
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: [
      { email: booking.attendee_email }
    ],
    conferenceData: {
      createRequest: {
        requestId: 'booking-' + booking.id,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  return response.data.id;
}

/**
 * Simple email validation
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  createBooking,
  validateBookingRequest,
  createCalendarEvent,
  isValidEmail
};