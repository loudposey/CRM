'use client';

import React, { useState } from 'react';

export default function BookingForm({ selectedSlot, onBookingComplete }) {
  const [formData, setFormData] = useState({
    attendee_email: '',
    attendee_phone: '',
    recording_consent: false
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.attendee_email) {
      newErrors.attendee_email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.attendee_email)) {
      newErrors.attendee_email = 'Invalid email address';
    }

    if (!formData.recording_consent && formData.recording_consent !== false) {
      newErrors.recording_consent = 'Recording consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          meeting_datetime: selectedSlot.start.toISOString()
        })
      });

      const result = await response.json();

      if (result.success) {
        onBookingComplete(result);
      } else {
        setErrors({ submit: result.error || 'Failed to schedule meeting' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to connect to server' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Address */}
      <div>
        <label htmlFor="attendee_email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="attendee_email"
          name="attendee_email"
          value={formData.attendee_email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.attendee_email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="your.email@example.com"
        />
        {errors.attendee_email && (
          <p className="mt-1 text-sm text-red-600">{errors.attendee_email}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="attendee_phone" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="attendee_phone"
          name="attendee_phone"
          value={formData.attendee_phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (555) 123-4567"
        />
        <p className="mt-1 text-sm text-gray-500">Optional - for backup contact</p>
      </div>

      {/* Recording Consent */}
      <div>
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="recording_consent"
            name="recording_consent"
            checked={formData.recording_consent}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="recording_consent" className="text-sm text-gray-700">
            I agree to this Zoom call being recorded *
          </label>
        </div>
        {errors.recording_consent && (
          <p className="mt-1 text-sm text-red-600">{errors.recording_consent}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          The recording will be used for quality and training purposes.
        </p>
      </div>

      {/* Submit Button */}
      <div>
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            submitting
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Scheduling...' : 'Schedule Meeting'}
        </button>
      </div>
    </form>
  );
}