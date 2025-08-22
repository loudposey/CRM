const { getAvailableTimeSlots } = require('./calendar');

// Mock the googleapis
const mockEventsList = jest.fn();
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    calendar: jest.fn().mockImplementation(() => ({
      events: {
        list: mockEventsList,
      },
    })),
  },
}));

describe('Calendar Availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return available 30-minute time slots for a given date', async () => {
    // Mock Google Calendar API response with no events (all slots available)
    mockEventsList.mockResolvedValue({
      data: {
        items: [], // No existing events
      },
    });

    const testDate = new Date('2024-01-15');
    const slots = await getAvailableTimeSlots(testDate);

    expect(slots).toBeDefined();
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    
    // Check that all slots are 30 minutes long
    slots.forEach((slot) => {
      const duration = slot.end.getTime() - slot.start.getTime();
      expect(duration).toBe(30 * 60 * 1000); // 30 minutes in milliseconds
      expect(slot.available).toBe(true);
    });
  });

  it.skip('should mark time slots as unavailable when events exist', async () => {
    // Mock Google Calendar API response with one event at 10:00 AM local time
    mockEventsList.mockResolvedValue({
      data: {
        items: [
          {
            start: { dateTime: '2024-01-15T10:00:00' },
            end: { dateTime: '2024-01-15T10:30:00' },
          },
        ],
      },
    });

    const testDate = new Date('2024-01-15');
    const slots = await getAvailableTimeSlots(testDate);

    // Should have both available and unavailable slots
    const availableSlots = slots.filter(slot => slot.available);
    const unavailableSlots = slots.filter(slot => !slot.available);

    expect(availableSlots.length).toBeGreaterThan(0);
    expect(unavailableSlots.length).toBeGreaterThan(0);
  });

  it('should only return slots within business hours (9 AM - 5 PM)', async () => {
    mockEventsList.mockResolvedValue({
      data: { items: [] },
    });

    const testDate = new Date('2024-01-15');
    const slots = await getAvailableTimeSlots(testDate);

    slots.forEach((slot) => {
      const startHour = slot.start.getHours();
      const endHour = slot.end.getHours();
      
      expect(startHour).toBeGreaterThanOrEqual(9);
      expect(endHour).toBeLessThanOrEqual(17);
    });
  });
});