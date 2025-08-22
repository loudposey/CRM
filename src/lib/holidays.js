import Holidays from 'date-holidays';

// Create holiday instance for United States
const hd = new Holidays('US');

/**
 * Check if a date is a business day (not weekend, not holiday)
 * @param {Date} date - The date to check
 * @returns {boolean} - True if it's a business day
 */
export function isBusinessDay(date) {
  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if it's a US federal holiday
  const holidays = hd.getHolidays(date.getFullYear());
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const isHoliday = holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toISOString().split('T')[0] === dateString;
  });

  return !isHoliday;
}

/**
 * Get the next available business day
 * @param {Date} date - Starting date
 * @returns {Date} - Next business day
 */
export function getNextBusinessDay(date) {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Get all business days in a date range
 * @param {Date} startDate - Start of range
 * @param {number} numberOfDays - How many days to check
 * @returns {Date[]} - Array of business day dates
 */
export function getBusinessDaysInRange(startDate, numberOfDays) {
  const businessDays = [];
  let currentDate = new Date(startDate);
  let daysChecked = 0;
  
  while (businessDays.length < numberOfDays && daysChecked < numberOfDays * 2) {
    if (isBusinessDay(currentDate)) {
      businessDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }
  
  return businessDays;
}

/**
 * Get holiday name if the date is a holiday
 * @param {Date} date - The date to check
 * @returns {string|null} - Holiday name or null
 */
export function getHolidayName(date) {
  const holidays = hd.getHolidays(date.getFullYear());
  const dateString = date.toISOString().split('T')[0];
  
  const holiday = holidays.find(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toISOString().split('T')[0] === dateString;
  });
  
  return holiday ? holiday.name : null;
}