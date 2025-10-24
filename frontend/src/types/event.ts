import type { ApiResponse, PaginatedResponse } from "./api";

export type EventStatus = "active" | "resolved" | "monitoring";

export interface Event {
    eventId: number;
    eventName: string;
    eventType: string;
    dateDeclared: string;
    endDate?: string | null;
    status: EventStatus;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateEventData {
    eventName: string;
    eventType: string;
    dateDeclared: string;
    endDate?: string | null;
    status?: EventStatus;
}

export interface UpdateEventData {
    eventName?: string;
    eventType?: string;
    dateDeclared?: string;
    endDate?: string | null;
    status?: EventStatus;
}

// API Response types
export type EventResponse = ApiResponse<Event>;
export type EventsResponse = PaginatedResponse<Event>;
