import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

export interface CreateEventData {
  event_name: string;
  event_type: string;
  date_declared: string; // Format: DD/MM/YYYY
  end_date: string | null; // Format: DD/MM/YYYY or null
  status: 'active' | 'monitoring' | 'resolved';
  center_ids: number[];
}

export interface UpdateEventData {
  event_name: string;
  event_type: string;
  date_declared: string;
  end_date: string | null;
  status: 'active' | 'monitoring' | 'resolved';
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

  async createEvent(data: CreateEventData): Promise<EventResponse> {
    try {
      const response = await api.post<EventResponse>('/api/events/', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create event');
      }
      throw error;
    }
  },

  async updateEvent(eventId: number, data: UpdateEventData): Promise<void> {
    try {
      await api.put(`/api/events/${eventId}`, data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update event');
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
  },

  async deleteEvent(eventId: number): Promise<void> {
    try {
      await api.delete(`/api/events/${eventId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete event');
      }
      throw error;
    }
  },

  async addCenterToEvent(eventId: number, centerId: number): Promise<void> {
    try {
      await api.post(`/api/events/${eventId}/centers`, { center_id: centerId });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to add center to event');
      }
      throw error;
    }
  },

  async removeCenterFromEvent(eventId: number, centerId: number): Promise<void> {
    try {
      await api.delete(`/api/events/${eventId}/centers/${centerId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to remove center from event');
      }
      throw error;
    }
  }
};