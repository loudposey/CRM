import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingForm } from './BookingForm';

// Mock the API calls
global.fetch = jest.fn();

describe('BookingForm', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render form fields correctly', () => {
    render(<BookingForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting date and time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recording consent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule meeting/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<BookingForm />);

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/meeting date and time is required/i)).toBeInTheDocument();
      expect(screen.getByText(/recording consent is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<BookingForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should prevent submission during business hours validation', async () => {
    render(<BookingForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const dateTimeInput = screen.getByLabelText(/meeting date and time/i);
    const consentCheckbox = screen.getByLabelText(/recording consent/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(dateTimeInput, { target: { value: '2025-12-15T06:00' } }); // 6 AM - outside business hours
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/meeting time must be during business hours/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        booking: {
          id: 1,
          attendee_email: 'test@example.com',
          meeting_datetime: '2025-12-15T10:00:00'
        }
      })
    });

    render(<BookingForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const dateTimeInput = screen.getByLabelText(/meeting date and time/i);
    const consentCheckbox = screen.getByLabelText(/recording consent/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.change(dateTimeInput, { target: { value: '2025-12-15T10:00' } });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendee_email: 'test@example.com',
          attendee_phone: '+1234567890',
          meeting_datetime: '2025-12-15T10:00',
          recording_consent: true
        })
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/meeting scheduled successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Database connection failed'
      })
    });

    render(<BookingForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const dateTimeInput = screen.getByLabelText(/meeting date and time/i);
    const consentCheckbox = screen.getByLabelText(/recording consent/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(dateTimeInput, { target: { value: '2025-12-15T10:00' } });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    // Mock slow API response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, booking: {} })
        }), 100)
      )
    );

    render(<BookingForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const dateTimeInput = screen.getByLabelText(/meeting date and time/i);
    const consentCheckbox = screen.getByLabelText(/recording consent/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(dateTimeInput, { target: { value: '2025-12-15T10:00' } });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /schedule meeting/i });
    fireEvent.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/scheduling.../i)).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should show recording consent information', () => {
    render(<BookingForm />);

    expect(screen.getByText(/i agree to this zoom call being recorded/i)).toBeInTheDocument();
  });
});