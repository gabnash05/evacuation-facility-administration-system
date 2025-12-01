import type { ApiResponse, PaginatedResponse, SearchParams } from "./api";

export type AttendanceStatus = "checked_in" | "checked_out" | "transferred";

export interface AttendanceRecord {
    record_id: number;
    individual_id: number;
    individual_name?: string;
    gender?: string;
    center_id: number;
    center_name?: string;
    transfer_from_center_id?: number | null;
    transfer_from_center_name?: string;
    event_id: number;
    event_name?: string;
    household_id: number;
    household_name?: string;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    transfer_time: string | null;
    notes: string | undefined;
}

export interface CreateAttendanceData {
    individual_id: number;
    center_id: number;
    event_id: number;
    household_id: number;
    recorded_by_user_id?: number; // Optional, will use current user if not provided
    check_in_time?: string; // Optional, defaults to current time
    notes?: string;
}

export interface CheckOutData {
    check_out_time?: string; // Optional, defaults to current time
    notes?: string;
}

export interface TransferData {
    transfer_to_center_id: number;
    transfer_time?: string; // Optional, defaults to current time
    recorded_by_user_id?: number; // Optional, will use current user if not provided
    notes?: string;
}

export interface AttendanceSummary {
    total_entries: number;
    current_checked_in: number;
    total_checked_out: number;
    total_transferred: number;
}

export interface OccupancyRecalculationResult {
    center_id: number;
    center_name: string;
    old_occupancy: number;
    new_occupancy: number;
}

// Query Parameter Types
export interface GetAttendanceParams extends SearchParams {
    center_id?: number;
    individual_id?: number;
    event_id?: number;
    household_id?: number;
    status?: AttendanceStatus;
    date?: string; // YYYY-MM-DD format
}

export interface GetCurrentAttendeesParams extends SearchParams {
    center_id?: number;
}

export interface GetEventAttendanceParams extends SearchParams {
    center_id?: number;
}

export interface GetTransferRecordsParams extends SearchParams {
    center_id?: number;
}

// API Response Types
export type AttendanceRecordResponse = ApiResponse<AttendanceRecord>;
export type AttendanceRecordsResponse = PaginatedResponse<AttendanceRecord>;
export type CurrentAttendeesResponse = PaginatedResponse<AttendanceRecord>;
export type EventAttendanceResponse = PaginatedResponse<AttendanceRecord>;
export type TransferRecordsResponse = PaginatedResponse<AttendanceRecord>;
export type AttendanceSummaryResponse = ApiResponse<AttendanceSummary>;
export type IndividualAttendanceHistoryResponse = ApiResponse<AttendanceRecord[]>;
export type OccupancyRecalculationResponse = ApiResponse<{ new_occupancy: number }>;
export type AllOccupanciesRecalculationResponse = ApiResponse<OccupancyRecalculationResult[]>;

export type TransferReason =
    | "medical_emergency"
    | "family_request"
    | "center_capacity"
    | "relocation"
    | "safety_concerns"
    | "special_needs"
    | "other";
