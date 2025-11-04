import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Adjust to your Flask port

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

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
    try {
      const response = await api.get<EventResponse[]>('/api/events/');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch events');
      }
      throw error;
    }
  },

  async getEventDetails(eventId: number): Promise<EventDetailsResponse> {
    try {
      const response = await api.get<EventDetailsResponse>(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch event details');
      }
      throw error;
    }
  },

  async updateEventStatus(eventId: number, status: string): Promise<void> {
    try {
      await api.put(`/api/events/${eventId}`, { status });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update event status');
      }
      throw error;
    }
  }
};