import type { ApiResponse, PaginatedResponse } from "./api";
import type { EvacuationCenter } from "./center";
import type { Individual } from "./individual";

export interface Household {
    householdId: number;
    householdName: string;
    address: string | null;
    centerId: number;
    householdHeadId?: number | null;
    createdAt: string;
    updatedAt?: string;
    // Optional joined fields
    center?: EvacuationCenter;
    householdHead?: Individual;
}

export interface CreateHouseholdData {
    householdName: string;
    address?: string;
    householdHeadId?: number;
    centerId: number;
}

export interface UpdateHouseholdData {
    householdName?: string;
    address?: string;
    householdHeadId?: number;
    centerId?: number;
}

// API Response types
export interface HouseholdResponse extends ApiResponse<Household> {}
export interface HouseholdsResponse extends PaginatedResponse<Household> {}
