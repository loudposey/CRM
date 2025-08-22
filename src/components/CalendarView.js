'use client';

import React, { useState, useEffect } from 'react';
import { isBusinessDay, getHolidayName } from '../lib/holidays.js';

export default function CalendarView({ onSlotSelect }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current date and next business days for date picker
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    let currentDate = new Date(today);
    let daysAdded = 0;
    let daysChecked = 0;
    
    // Get up to 14 business days (or check up to 30 calendar days)
    while (daysAdded < 14 && daysChecked < 30) {
      if (isBusinessDay(currentDate)) {
        dates.push(new Date(currentDate));
        daysAdded++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return dates;
  };

  const fetchTimeSlots = async (date) => {
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
    fetchTimeSlots(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSlotClick = (slot) => {
    if (slot.available) {
      onSlotSelect({ start: slot.start, end: slot.end });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const availableDates = getAvailableDates();

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div>
        <h3 className="text-lg font-medium mb-3">Select a Date</h3>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {availableDates.map((date) => {
            const holidayName = getHolidayName(date);
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateChange(date)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  selectedDate.toDateString() === date.toDateString()
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title={holidayName || 'Available for booking'}
              >
                <div className="font-medium">{formatDate(date)}</div>
                <div className="text-xs mt-1">{date.getDate()}</div>
                {holidayName && (
                  <div className="text-xs text-red-500 mt-1">Holiday</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <h3 className="text-lg font-medium mb-3">
          Available Times for {formatDate(selectedDate)}
        </h3>
        
        {loading && (
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
                onClick={() => fetchTimeSlots(selectedDate)}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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

        {!loading && !error && timeSlots.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No available time slots for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}