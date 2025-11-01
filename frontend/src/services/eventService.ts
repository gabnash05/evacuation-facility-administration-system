const API_BASE_URL = 'http://localhost:5000'; // Adjust to your Flask port

export interface EventResponse {
  event_id: number;
  event_name: string;
  event_type: string;
  date_declared: string;
  end_date: string | null;
  status: 'active' | 'monitoring' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface EventDetailsResponse {
  event_id: number;
  event_name: string;
  event_type: string;
  status: string;
  centers: {
    center_id: number;
    center_name: string;
    barangay: string;
    capacity: number;
    current_occupancy: number;
    occupancy: string;
  }[];
}

export const eventService = {
  async getAllEvents(): Promise<EventResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/events/`);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return response.json();
  },

  async getEventDetails(eventId: number): Promise<EventDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch event details');
    }
    return response.json();
  },

  async updateEventStatus(eventId: number, status: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update event status');
    }
  }
};