import type { PaginatedResponse } from "./api";
import type { EvacuationCenter } from "./center";
import type { Event as EvacuationEvent } from "./event";

export interface EventCenter {
    eventId: number;
    centerId: number;
    // Optional joined fields
    event?: EvacuationEvent;
    center?: EvacuationCenter;
}

export interface LinkCenterToEventData {
    centerId: number;
}

// API Response types
export type EventCentersResponse = PaginatedResponse<EventCenter>;
