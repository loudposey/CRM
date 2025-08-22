export interface Booking {
  id: number;
  attendee_email: string;
  attendee_phone?: string;
  meeting_datetime: Date;
  duration_minutes: number;
  recording_consent: boolean;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  google_event_id?: string;
  attendee_google_event_id?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingRequest {
  attendee_email: string;
  attendee_phone?: string;
  meeting_datetime: string; // ISO string
  recording_consent: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}