import { generateTimeSlots } from './calendar';

describe('Mountain Time Slot Validation', () => {
  test('should ONLY offer slots between 07:00-17:00 Mountain Time', () => {
    // Test with a future date
    const testDate = new Date('2025-12-15'); // Future date
    const slots = generateTimeSlots(testDate);
    
    // Should have slots
    expect(slots.length).toBeGreaterThan(0);
    
    // Every slot should be between 7:00-17:00 Mountain Time
    slots.forEach(slot => {
      const slotMT = new Date(slot.start.toLocaleString("en-US", {timeZone: "America/Denver"}));
      const hourMT = slotMT.getHours();
      
      // MUST be between 7:00-17:00 (inclusive start, exclusive end at 17:00)
      expect(hourMT).toBeGreaterThanOrEqual(7);
      expect(hourMT).toBeLessThan(17);
    });
  });
  
  test('should NOT offer any evening slots (18:00+ MT)', () => {
    const testDate = new Date('2025-12-15');
    const slots = generateTimeSlots(testDate);
    
    slots.forEach(slot => {
      const slotMT = new Date(slot.start.toLocaleString("en-US", {timeZone: "America/Denver"}));
      const hourMT = slotMT.getHours();
      
      // NO slots at 18:00 (6pm) or later
      expect(hourMT).toBeLessThan(18);
    });
  });
  
  test('should NOT offer any early morning slots (before 07:00 MT)', () => {
    const testDate = new Date('2025-12-15');
    const slots = generateTimeSlots(testDate);
    
    slots.forEach(slot => {
      const slotMT = new Date(slot.start.toLocaleString("en-US", {timeZone: "America/Denver"}));
      const hourMT = slotMT.getHours();
      
      // NO slots before 07:00 (7am)
      expect(hourMT).toBeGreaterThanOrEqual(7);
    });
  });
  
  test('should offer exactly 20 slots per day (7am-5pm, 30min intervals)', () => {
    const testDate = new Date('2025-12-15');
    const slots = generateTimeSlots(testDate);
    
    // 7:00-17:00 = 10 hours = 20 thirty-minute slots
    expect(slots.length).toBe(20);
  });
});