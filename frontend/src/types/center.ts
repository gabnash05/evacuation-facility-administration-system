import type { ApiResponse, PaginatedResponse } from "./api";

export type CenterStatus = "active" | "inactive" | "closed";

export interface EvacuationCenter {
    centerId: number;
    address: string;
    capacity: number;
    status: CenterStatus;
    currentOccupancy: number;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateCenterData {
    address: string;
    capacity: number;
    status?: CenterStatus;
}

export interface UpdateCenterData {
    address?: string;
    capacity?: number;
    status?: CenterStatus;
    currentOccupancy?: number;
}

// API Response types
export interface CenterResponse extends ApiResponse<EvacuationCenter> {}
export interface CentersResponse extends PaginatedResponse<EvacuationCenter> {}
