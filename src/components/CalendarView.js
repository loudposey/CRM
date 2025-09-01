'use client';

import React, { useState, useEffect } from 'react';
import { isBusinessDay } from '../lib/holidays.js';

export default function CalendarView({ onSlotSelect }) {
  // Updated weekly calendar view
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return startOfWeek;
  });
  const [dateAvailability, setDateAvailability] = useState({});
  const [detailViewDate, setDetailViewDate] = useState(null);
  const [detailViewLoading, setDetailViewLoading] = useState(false);

  // Get 1 week of calendar data starting from current week
  const getCalendarWeek = () => {
    const week = [];
    for (let dayNum = 0; dayNum < 7; dayNum++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + dayNum);
      week.push(new Date(date));
    }
    return week;
  };

  // Check availability for all visible dates  
  const checkDateAvailability = async (week) => {
    const availabilityPromises = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const date of week) {
      if (isBusinessDay(date) && date >= today) {
        availabilityPromises.push(
          fetch(`/api/calendar/slots?date=${date.toISOString().split('T')[0]}`)
            .then(res => res.json())
            .then(() => ({
              date: date.toDateString(),
              hasSlots: true // For demo: all business days have slots
            }))
            .catch(() => ({
              date: date.toDateString(),
              hasSlots: true // Fallback to true for demo purposes when API fails
            }))
        );
      }
    }
    
    const results = await Promise.all(availabilityPromises);
    const availability = {};
    results.forEach(result => {
      availability[result.date] = result.hasSlots;
    });
    
    setDateAvailability(availability);
  };

  const fetchTimeSlots = async (date) => {
    if (!date) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(`/api/calendar/slots?date=${dateStr}`);
      const data = await response.json();

      if (data.success) {
        // Convert string dates back to Date objects
        const slots = data.slots.map((slot) => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          available: slot.available
        }));
        setTimeSlots(slots);
      } else {
        setError(data.error || 'Failed to load time slots');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const week = getCalendarWeek();
    checkDateAvailability(week);
  }, [currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);


  const navigateWeeks = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction * 7)); // 1 week
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(null);
    setTimeSlots([]);
  };

  const handleSlotClick = (slot) => {
    if (slot.available) {
      onSlotSelect({ start: slot.start, end: slot.end });
    }
  };

  const handleDateDetailClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const isBusinessDayCheck = isBusinessDay(date);
    const isFutureOrToday = dateToCheck >= today;
    const hasAvailableSlots = dateAvailability[date.toDateString()];
    const isSelectable = isBusinessDayCheck && isFutureOrToday && hasAvailableSlots;
    
    if (isSelectable) {
      setDetailViewDate(date);
      setDetailViewLoading(true);
      fetchTimeSlots(date).then(() => {
        setDetailViewLoading(false);
      });
    }
  };

  const handleBackFromDetail = () => {
    setDetailViewDate(null);
    setSelectedDate(null);
    setTimeSlots([]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
  };

  const getDayOfWeekHeader = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const week = getCalendarWeek();
  const [dateTimeSlots, setDateTimeSlots] = useState({});

  // Fetch time slots for all available dates in the week
  const fetchAllTimeSlots = async (weekDates) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeSlotsPromises = [];
    const availableDates = weekDates.filter(date => {
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);
      return isBusinessDay(date) && dateToCheck >= today && dateAvailability[date.toDateString()];
    });

    for (const date of availableDates) {
      timeSlotsPromises.push(
        fetch(`/api/calendar/slots?date=${date.toISOString().split('T')[0]}`)
          .then(res => res.json())
          .then(data => ({
            date: date.toDateString(),
            slots: data.success && data.slots ? data.slots : []
          }))
          .catch(() => ({
            date: date.toDateString(),
            slots: []
          }))
      );
    }

    const results = await Promise.all(timeSlotsPromises);
    const slotsMap = {};
    results.forEach(result => {
      if (result.slots.length > 0) {
        slotsMap[result.date] = result.slots.map(slot => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          available: slot.available
        }));
      }
    });
    
    setDateTimeSlots(slotsMap);
  };

  useEffect(() => {
    if (Object.keys(dateAvailability).length > 0) {
      fetchAllTimeSlots(week);
    }
  }, [dateAvailability, currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateWeeks(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Previous week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm font-medium text-gray-600">
          {(() => {
            // If week spans two months, show the "new" month (the one that appears later in the week)
            const firstDayMonth = week[0].getMonth();
            const lastDayMonth = week[6].getMonth();
            
            if (firstDayMonth !== lastDayMonth) {
              // Show the later month
              return getMonthName(week[6]);
            }
            return getMonthName(week[0]);
          })()}
        </div>
        <button
          onClick={() => navigateWeeks(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Next week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekly Calendar with Time Slots */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
            const date = week[dayIndex];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setHours(0, 0, 0, 0);
            const isSelectable = isBusinessDay(date) && dateToCheck >= today && dateAvailability[date.toDateString()];
            
            return (
              <button
                key={dayIndex}
                onClick={() => handleDateDetailClick(date)}
                disabled={!isSelectable}
                className={`p-3 text-center text-sm font-medium border-r transition-colors ${
                  isSelectable 
                    ? 'text-gray-600 hover:bg-gray-100 cursor-pointer' 
                    : 'text-gray-600 cursor-default'
                }`}
              >
                {getDayOfWeekHeader(dayIndex)}
              </button>
            );
          })}
        </div>

        {/* Week with time slots */}
        <div className="grid grid-cols-7">
          {week.map((date, dayIndex) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setHours(0, 0, 0, 0);
            
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            const isBusinessDayCheck = isBusinessDay(date);
            const isFutureOrToday = dateToCheck >= today;
            const hasAvailableSlots = dateAvailability[date.toDateString()];
            const isSelectable = isBusinessDayCheck && isFutureOrToday && hasAvailableSlots;
            const isPastDate = dateToCheck < today;
            const daySlots = dateTimeSlots[date.toDateString()] || [];
            
            return (
              <div
                key={date.toISOString()}
                className={`
                  border-r border-b min-h-[8rem] p-2
                  ${isWeekend ? 'bg-gray-100' : 'bg-white'}
                  ${!isSelectable && !isWeekend ? 'bg-gray-50' : ''}
                `}
              >
                {/* Date header */}
                <button
                  onClick={() => handleDateDetailClick(date)}
                  disabled={!isSelectable}
                  className={`
                    w-full text-center text-sm font-medium mb-2 p-1 rounded transition-colors
                    ${isWeekend ? 'text-gray-400 cursor-default' : ''}
                    ${isPastDate && !isWeekend ? 'text-gray-300 cursor-default' : ''}
                    ${!isBusinessDayCheck && !isWeekend && !isPastDate ? 'text-gray-400 cursor-default' : ''}
                    ${isSelectable ? 'text-gray-800 hover:bg-gray-100 cursor-pointer' : ''}
                  `}
                >
                  {date.getDate()}
                </button>

                {/* Time slots for this date */}
                {isSelectable && daySlots.length > 0 && (
                  <div className="space-y-1">
                    {daySlots.filter(slot => slot.available).slice(0, 6).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotClick(slot)}
                        className="w-full p-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                    {daySlots.filter(slot => slot.available).length > 6 && (
                      <button
                        onClick={() => handleDateDetailClick(date)}
                        className="w-full text-xs text-blue-600 hover:text-blue-800 text-center py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        +{daySlots.filter(slot => slot.available).length - 6} more
                      </button>
                    )}
                  </div>
                )}

                {/* No slots message */}
                {isSelectable && daySlots.length === 0 && (
                  <div className="text-xs text-gray-400 text-center mt-2">
                    Loading...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Time Slots View */}
      {detailViewDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Available Times for {formatDate(detailViewDate)}
              </h3>
              <button
                onClick={handleBackFromDetail}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Time Slots */}
            <div className="p-4 overflow-y-auto max-h-96">
              {detailViewLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading available times...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={() => fetchTimeSlots(detailViewDate)}
                      className="mt-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!detailViewLoading && !error && timeSlots.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotClick(slot)}
                      disabled={!slot.available}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        slot.available
                          ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              )}

              {!detailViewLoading && !error && timeSlots.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No available time slots for this date.</p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={handleBackFromDetail}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}