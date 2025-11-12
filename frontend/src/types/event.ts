// types/event.ts
import type { ApiResponse, PaginatedResponse } from "./api";
import type { EvacuationCenter } from "./center";

export type EventStatus = "active" | "resolved" | "monitoring";

export interface Event {
    event_id: number;
    event_name: string;
    event_type: string;
    date_declared: string;
    end_date?: string | null;
    status: string;
    capacity: number;
    max_occupancy: number;
    usage_percentage: number;
    total_capacity?: number;
    total_occupancy?: number;
    overall_usage_percentage?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateEventData {
    event_name: string;
    event_type: string;
    date_declared: string;
    end_date?: string | null;
    status?: EventStatus;
}

export interface UpdateEventData {
    event_name?: string;
    event_type?: string;
    date_declared?: string;
    end_date?: string | null;
    status?: EventStatus;
}

// For event details modal - matches backend response exactly
export interface EventDetails {
    event_id: number;
    event_name: string;
    event_type: string;
    date_declared: string;
    end_date?: string | null;
    status: EventStatus;
    evacuation_centers: EvacuationCenter[];
}

// API Response types
export type EventResponse = ApiResponse<Event>;
export type EventsResponse = PaginatedResponse<Event>;

// Parameters for getting events
export interface GetEventsParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    center_id?: number;
}
