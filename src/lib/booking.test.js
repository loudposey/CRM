const { createBooking, validateBookingRequest } = require('./booking');

// Mock the database and APIs
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

const mockEventsInsert = jest.fn();
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    calendar: jest.fn().mockImplementation(() => ({
      events: {
        insert: mockEventsInsert,
      },
    })),
  },
}));

describe('Booking Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBookingRequest', () => {
    it('should validate a valid booking request', () => {
      const validRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T10:00:00', // Future date, local time
        recording_consent: true
      };

      const result = validateBookingRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject booking with invalid email', () => {
      const invalidRequest = {
        attendee_email: 'invalid-email',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T10:00:00',
        recording_consent: true
      };

      const result = validateBookingRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email address');
    });

    it('should reject booking with missing required fields', () => {
      const incompleteRequest = {
        attendee_email: 'test@example.com',
        // missing meeting_datetime and recording_consent
      };

      const result = validateBookingRequest(incompleteRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject booking in the past', () => {
      const pastRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2020-01-15T10:00:00.000Z', // Past date
        recording_consent: true
      };

      const result = validateBookingRequest(pastRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Meeting time cannot be in the past');
    });

    it('should reject booking outside business hours', () => {
      const outsideHoursRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T06:00:00', // 6 AM - before business hours
        recording_consent: true
      };

      const result = validateBookingRequest(outsideHoursRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Meeting time must be during business hours (9 AM - 5 PM)');
    });
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      // Mock database insertion
      const { sql } = require('@vercel/postgres');
      sql.mockResolvedValue({
        rows: [
          {
            id: 1,
            attendee_email: 'test@example.com',
            meeting_datetime: new Date('2024-01-15T10:00:00.000Z'),
            google_event_id: 'event123',
            zoom_meeting_id: 'zoom456'
          }
        ]
      });

      // Mock Google Calendar API
      mockEventsInsert.mockResolvedValue({
        data: { id: 'event123' }
      });

      const bookingRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T10:00:00',
        recording_consent: true
      };

      const result = await createBooking(bookingRequest);

      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking.id).toBe(1);
      expect(result.booking.google_event_id).toBe('event123');
      
      // Verify database call
      expect(sql).toHaveBeenCalled();
      
      // Verify Google Calendar API was called
      expect(mockEventsInsert).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { sql } = require('@vercel/postgres');
      sql.mockRejectedValue(new Error('Database connection failed'));

      const bookingRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T10:00:00',
        recording_consent: true
      };

      const result = await createBooking(bookingRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database');
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      // Mock successful database but failed calendar
      const { sql } = require('@vercel/postgres');
      sql.mockResolvedValue({
        rows: [{ id: 1, attendee_email: 'test@example.com' }]
      });

      mockEventsInsert.mockRejectedValue(new Error('Calendar API failed'));

      const bookingRequest = {
        attendee_email: 'test@example.com',
        attendee_phone: '+1234567890',
        meeting_datetime: '2025-12-15T10:00:00',
        recording_consent: true
      };

      const result = await createBooking(bookingRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Calendar');
    });
  });
});