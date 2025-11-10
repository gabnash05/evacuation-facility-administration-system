import type { ApiResponse, PaginatedResponse, SearchParams } from "./api";

export type CenterStatus = "active" | "inactive" | "closed";

export interface EvacuationCenter {
    center_id: number;
    center_name: string;
    address: string;
    capacity: number;
    status: CenterStatus;
    current_occupancy: number;
    created_at: string;
    updated_at?: string;
    photo_data?: string; // Change from photo_url to photo_data for base64
}

export interface CreateCenterData {
    center_name: string;
    address: string;
    capacity: number;
    status?: CenterStatus;
    photo?: File;
}

export interface UpdateCenterData {
    center_name?: string;
    address?: string;
    capacity?: number;
    status?: CenterStatus;
    current_occupancy?: number;
    photo?: File;
}

export interface GetCentersParams extends SearchParams {
    status?: string;
}

// API Response types
export type CenterResponse = ApiResponse<EvacuationCenter>;
export type CentersResponse = PaginatedResponse<EvacuationCenter>;
