'use client';

import React, { useState } from 'react';
import CalendarView from './CalendarView.js';
import BookingForm from './BookingForm';

export default function MeetingScheduler() {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentStep, setCurrentStep] = useState('calendar');
  const [bookingResult, setBookingResult] = useState(null);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setCurrentStep('form');
  };

  const handleBookingComplete = (result) => {
    setBookingResult(result);
    setCurrentStep('confirmation');
  };

  const handleBackToCalendar = () => {
    setSelectedSlot(null);
    setCurrentStep('calendar');
  };

  const handleStartOver = () => {
    setSelectedSlot(null);
    setBookingResult(null);
    setCurrentStep('calendar');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {currentStep === 'calendar' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select a Time Slot</h2>
          <CalendarView onSlotSelect={handleSlotSelect} />
        </div>
      )}

      {currentStep === 'form' && selectedSlot && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToCalendar}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Calendar
            </button>
          </div>
          <h2 className="text-xl font-semibold mb-4">Confirm Your Details</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Selected Time:</strong> {selectedSlot.start.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">
              Duration: 30 minutes
            </p>
          </div>
          <BookingForm 
            selectedSlot={selectedSlot} 
            onBookingComplete={handleBookingComplete}
          />
        </div>
      )}

      {currentStep === 'confirmation' && bookingResult && (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Meeting Scheduled!
            </h2>
            <p className="text-gray-600 mb-4">
              Your meeting has been successfully scheduled. You'll receive a calendar invite shortly.
            </p>
          </div>

          {bookingResult.booking && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-2">Meeting Details:</h3>
              <p><strong>Email:</strong> {bookingResult.booking.attendee_email}</p>
              <p><strong>Time:</strong> {new Date(bookingResult.booking.meeting_datetime).toLocaleString()}</p>
              <p><strong>Duration:</strong> 30 minutes</p>
              {bookingResult.booking.attendee_phone && (
                <p><strong>Phone:</strong> {bookingResult.booking.attendee_phone}</p>
              )}
              <p><strong>Recording:</strong> {bookingResult.booking.recording_consent ? 'Agreed' : 'Declined'}</p>
              
              {/* Zoom Meeting Details */}
              {bookingResult.booking.zoom_meeting && (
                <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <h4 className="font-semibold text-blue-800 mb-2">🎥 Zoom Meeting Created</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Meeting ID:</strong> {bookingResult.booking.zoom_meeting.meeting_id}
                  </p>
                  {bookingResult.booking.zoom_meeting.password && (
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Password:</strong> {bookingResult.booking.zoom_meeting.password}
                    </p>
                  )}
                  <a
                    href={bookingResult.booking.zoom_meeting.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Join Zoom Meeting
                  </a>
                </div>
              )}
              
              {/* Show message if Zoom failed but booking succeeded */}
              {bookingResult.booking.zoom_join_url === null && (
                <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-700">
                    📅 Meeting scheduled successfully! Zoom meeting creation is pending - you'll receive the meeting link via email.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStartOver}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Schedule Another Meeting
          </button>
        </div>
      )}
    </div>
  );
}