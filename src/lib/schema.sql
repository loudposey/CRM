-- Meeting bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(50),
    meeting_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    recording_consent BOOLEAN DEFAULT false,
    zoom_meeting_id VARCHAR(255),
    zoom_join_url TEXT,
    google_event_id VARCHAR(255),
    attendee_google_event_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(meeting_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(attendee_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);