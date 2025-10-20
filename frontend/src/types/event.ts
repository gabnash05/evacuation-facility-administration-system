import type { ApiResponse, PaginatedResponse } from "./api";

export type EventStatus = "active" | "resolved" | "monitoring";

export interface Event {
    eventId: number;
    eventType: string;
    dateDeclared: string;
    endDate?: string | null;
    status: EventStatus;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateEventData {
    eventType: string;
    dateDeclared: string;
    endDate?: string | null;
    status?: EventStatus;
}

export interface UpdateEventData {
    eventType?: string;
    dateDeclared?: string;
    endDate?: string | null;
    status?: EventStatus;
}

// API Response types
export interface EventResponse extends ApiResponse<Event> {}
export interface EventsResponse extends PaginatedResponse<Event> {}
