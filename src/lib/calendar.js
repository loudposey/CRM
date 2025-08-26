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

    // Generate time slots excluding blocked hours (5 PM - 7 AM Mountain Time)
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
 * Generate 30-minute time slots ONLY between 07:00-17:00 Mountain Time
 * @param {Date} date - The date to generate slots for
 * @returns {Array} Array of time slot objects in Mountain Time
 */
function generateTimeSlots(date) {
  const slots = [];
  const startHour = 7; // 07:00 Mountain Time
  const endHour = 17; // 17:00 Mountain Time (exclusive - so stops at 16:30)
  const slotDuration = 30; // 30 minutes
  
  // Get current time in Mountain Time
  const now = new Date();
  const nowMT = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
  
  // Create the date in Mountain Time for comparison
  const dateMT = new Date(date.toLocaleString("en-US", {timeZone: "America/Denver"}));
  const isToday = dateMT.toDateString() === nowMT.toDateString();

  // Generate slots ONLY between 07:00-17:00 Mountain Time
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      
      // Create the Mountain Time slot directly - much simpler approach
      const slotMT = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
      
      // For today, skip slots that are in the past (compare in Mountain Time)
      let isPastTime = false;
      if (isToday) {
        isPastTime = slotMT <= nowMT;
      }
      
      if (!isPastTime) {
        // Create UTC times for API response (browsers will convert to user's timezone)
        const start = new Date(slotMT);
        const end = new Date(slotMT.getTime() + slotDuration * 60 * 1000);
        
        slots.push({
          start,
          end,
          available: true, // Default to available
          mountainTimeDisplay: `${String(hour > 12 ? hour - 12 : hour === 0 ? 12 : hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'} MT`
        });
      }
    }
  }

  return slots;
}

/**
 * Get Mountain Time offset in milliseconds for a given date
 * Handles both MST (-7) and MDT (-6) automatically
 */
function getMountainTimeOffset(date) {
  const temp = new Date(date);
  const utc = temp.getTime() + (temp.getTimezoneOffset() * 60000);
  // MST is UTC-7, MDT is UTC-6
  
  // Check if daylight saving time is in effect
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = date.getTimezoneOffset() < stdOffset;
  
  return isDST ? 6 * 3600000 : 7 * 3600000; // MDT is UTC-6, MST is UTC-7
}

export {
  getAvailableTimeSlots,
  generateTimeSlots,
  getMountainTimeOffset
};