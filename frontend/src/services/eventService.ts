// services/eventService.ts
import { api, handleApiError } from "./api";
import type { Event, EventDetails, GetEventsParams, EventsResponse } from "@/types/event";

export class EventService {
    static async getEvents(params: GetEventsParams = {}): Promise<EventsResponse> {
        try {
            const response = await api.get<EventsResponse>("/events", {
                params,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getEventById(id: number): Promise<{
        success: boolean;
        data: Event;
    }> {
        try {
            const response = await api.get<{ success: boolean; data: Event }>(`/events/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createEvent(data: {
        event_name: string;
        event_type: string;
        date_declared: string;
        end_date?: string | null;
        status: string;
        center_ids?: number[];
    }): Promise<{ success: boolean; data: Event }> {
        try {
            const response = await api.post<{ success: boolean; data: Event }>("/events", data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateEvent(
        id: number,
        data: {
            event_name?: string;
            event_type?: string;
            date_declared?: string;
            end_date?: string | null;
            status?: string;
            center_ids?: number[];
        }
    ): Promise<{ success: boolean; data: Event }> {
        try {
            const response = await api.put<{ success: boolean; data: Event }>(
                `/events/${id}`,
                data,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteEvent(id: number): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete<{ success: boolean; message: string }>(
                `/events/${id}`,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getEventCenters(eventId: number): Promise<{
        success: boolean;
        data: Array<{
            center_id: number;
            center_name: string;
            barangay: string;
            capacity: number;
            current_occupancy: number;
            occupancy: string;
        }>;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: Array<{
                    center_id: number;
                    center_name: string;
                    barangay: string;
                    capacity: number;
                    current_occupancy: number;
                    occupancy: string;
                }>;
            }>(`/events/${eventId}/centers`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getEventsByCenterId(centerId: number): Promise<{
        success: boolean;
        data: Event[];
    }> {
        try {
            const response = await api.get<{ success: boolean; data: Event[] }>(
                `/evacuation_centers/${centerId}/events`,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async addCenterToEvent(
        eventId: number,
        centerId: number
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.post<{ success: boolean; message: string }>(
                `/events/${eventId}/centers`,
                { center_id: centerId },
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async removeCenterFromEvent(
        eventId: number,
        centerId: number
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete<{ success: boolean; message: string }>(
                `/events/${eventId}/centers/${centerId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getEventDetails(eventId: number): Promise<{
        success: boolean;
        data: EventDetails;
    }> {
        try {
            const response = await api.get<{ success: boolean; data: EventDetails }>(
                `/events/${eventId}/details`,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

// Export a default instance for backward compatibility
export const eventService = EventService;
