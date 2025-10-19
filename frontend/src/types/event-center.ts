import type { PaginatedResponse } from "./api";
import type { EvacuationCenter } from "./center";

export interface EventCenter {
    eventId: number;
    centerId: number;
    // Optional joined fields
    event?: Event;
    center?: EvacuationCenter;
}

export interface LinkCenterToEventData {
    centerId: number;
}

// API Response types
export interface EventCentersResponse extends PaginatedResponse<EventCenter> {}
