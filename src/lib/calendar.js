import { google } from 'googleapis';
import { isBusinessDay } from './holidays.js';

/**
 * Get available 30-minute time slots for a given date
 * @param {Date} date - The date to check availability for
 * @returns {Promise<Array>} Array of time slots with availability status
 */
async function getAvailableTimeSlots(date) {
  try {
    // Check if the date is a business day (no weekends or holidays)
    if (!isBusinessDay(date)) {
      return []; // Return empty array for non-business days
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL || 'http://localhost:3001/api/auth/callback/google'
    );

    // For now, we'll simulate having a valid token
    // In production, this would need proper OAuth flow
    // oauth2Client.setCredentials({
    //   access_token: 'your-access-token',
    //   refresh_token: 'your-refresh-token'
    // });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Generate time slots for business hours (9 AM - 5 PM)
    const timeSlots = generateTimeSlots(date);

    // Get existing events for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let existingEvents = [];
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    existingEvents = response.data.items || [];

    // Mark slots as unavailable if they conflict with existing events
    return timeSlots.map(slot => {
      const isAvailable = !existingEvents.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        
        
        // Check if slot overlaps with existing event
        return (slot.start < eventEnd && slot.end > eventStart);
      });

      return {
        ...slot,
        available: isAvailable
      };
    });

  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    
    // Check if the date is a business day before returning fallback slots
    if (!isBusinessDay(date)) {
      return []; // Return empty array for non-business days
    }
    
    // Return available slots even if calendar API fails (for testing)
    const timeSlots = generateTimeSlots(date);
    return timeSlots.map(slot => ({ ...slot, available: true }));
  }
}

/**
 * Generate 30-minute time slots for business hours (9 AM - 5 PM)
 * @param {Date} date - The date to generate slots for
 * @returns {Array} Array of time slot objects
 */
function generateTimeSlots(date) {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const slotDuration = 30; // 30 minutes

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      // Use the date's year, month, and day to avoid timezone issues
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
      
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + slotDuration);
      
      // Don't include slots that end after business hours
      if (end.getHours() <= endHour) {
        slots.push({
          start,
          end,
          available: true // Default to available
        });
      }
    }
  }

  return slots;
}

export {
  getAvailableTimeSlots,
  generateTimeSlots
};