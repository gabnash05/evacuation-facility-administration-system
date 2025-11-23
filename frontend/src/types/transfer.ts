import type { ApiResponse } from "./api";

// Individual for transfer
export interface TransferIndividual {
    individual_id: number;
    first_name: string;
    last_name: string;
    household_id: number;
    household_name: string;
    center_id: number;
    center_name: string;
    status: "sick" | "injured" | "at_risk" | "normal";
    date_of_birth?: string;
    gender?: string;
}

// Evacuation center for transfer destination
export interface TransferCenter {
    center_id: number;
    center_name: string;
    address: string;
    capacity: number;
    current_occupancy: number;
    status: "active" | "inactive" | "closed";
}

// Transfer destination types
export type TransferDestinationType = "center" | "home" | "hospital" | "other";

// Transfer reason options
export type TransferReason =
    | "medical_emergency"
    | "family_request"
    | "center_capacity"
    | "relocation"
    | "safety_concerns"
    | "special_needs"
    | "other";

// Data to send for transfer request
export interface TransferIndividualData {
    individual_ids: number[];
    destination_type: TransferDestinationType;
    destination_center_id?: number; // Required if destination_type is "center"
    reason: TransferReason;
    notes?: string;
}

// Transfer request response
export interface TransferRecord {
    record_id: number;
    individual_id: number;
    from_center_id: number;
    to_center_id?: number;
    transfer_time: string;
    reason: TransferReason;
    status: "transferred" | "pending" | "completed";
    recorded_by_user_id: number;
    notes?: string;
}

// API Response types
export type TransferIndividualsResponse = ApiResponse<{
    results: TransferIndividual[];
    pagination?: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    };
}>;

export type TransferCentersResponse = ApiResponse<TransferCenter[]>;

export type TransferSubmitResponse = ApiResponse<{
    transfer_records: TransferRecord[];
    message: string;
}>;

// Parameters for getting individuals
export interface GetTransferIndividualsParams {
    center_id?: number;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}