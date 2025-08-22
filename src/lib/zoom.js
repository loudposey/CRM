import axios from 'axios';

// Zoom API client for creating meetings
class ZoomClient {
  constructor() {
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.baseURL = 'https://api.zoom.us/v2';
    this.accessToken = null;
  }

  // Get OAuth access token using server-to-server OAuth
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Zoom API credentials not configured');
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://zoom.us/oauth/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Zoom access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Zoom API');
    }
  }

  // Create a Zoom meeting
  async createMeeting(meetingData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const meetingPayload = {
        topic: meetingData.topic || 'Scheduled Meeting',
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime, // ISO 8601 format
        duration: meetingData.duration || 30, // minutes
        timezone: 'America/Los_Angeles', // You can make this configurable
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          use_pmi: false,
          approval_type: 0, // Automatically approve
          audio: 'both', // Both telephony and VoIP
          auto_recording: meetingData.recordingConsent ? 'cloud' : 'none'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/users/me/meetings`,
        meetingPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        meeting: {
          id: response.data.id,
          join_url: response.data.join_url,
          start_url: response.data.start_url,
          password: response.data.password,
          topic: response.data.topic,
          start_time: response.data.start_time,
          duration: response.data.duration
        }
      };

    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        // Token might be expired, reset it
        this.accessToken = null;
        throw new Error('Zoom authentication failed. Please check your credentials.');
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create Zoom meeting'
      };
    }
  }

  // Update an existing meeting
  async updateMeeting(meetingId, meetingData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const updatePayload = {
        topic: meetingData.topic,
        start_time: meetingData.startTime,
        duration: meetingData.duration || 30,
        settings: {
          auto_recording: meetingData.recordingConsent ? 'cloud' : 'none'
        }
      };

      await axios.patch(
        `${this.baseURL}/meetings/${meetingId}`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update Zoom meeting'
      };
    }
  }

  // Delete a meeting
  async deleteMeeting(meetingId) {
    try {
      const accessToken = await this.getAccessToken();
      
      await axios.delete(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete Zoom meeting'
      };
    }
  }
}

// Export a singleton instance
export const zoomClient = new ZoomClient();

// Convenience function for creating meetings
export async function createZoomMeeting(bookingData) {
  const meetingData = {
    topic: `Meeting with ${bookingData.attendee_email}`,
    startTime: bookingData.meeting_datetime,
    duration: bookingData.duration_minutes || 30,
    recordingConsent: bookingData.recording_consent || false
  };

  return await zoomClient.createMeeting(meetingData);
}