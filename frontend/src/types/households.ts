import type { ApiResponse, PaginatedResponse } from "./api";
import type { EvacuationCenter } from "./center";
import type { Individual } from "./individual";

export interface Household {
    household_id: number;
    household_name: string;
    address: string | null;
    center_id: number;
    household_head_id?: number | null;
    created_at: string;
    updated_at?: string;
    center?: EvacuationCenter;
    household_head?: Individual;
}

export interface CreateHouseholdData {
    household_name: string;
    address?: string;
    household_head_id?: number;
    center_id: number;
    individuals: Omit<CreateIndividualData, "household_id">[]; // Remove household_id requirement
}

// types/individual.ts
export interface CreateIndividualData {
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_to_head: string;
    household_id: number; // This will be provided when creating
}

export interface UpdateIndividualData {
    individual_id?: number; // For existing individuals
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_to_head: string;
}

export interface UpdateHouseholdData {
    household_name?: string;
    address?: string;
    household_head_id?: number;
    center_id?: number;
    individuals?: UpdateIndividualData[];
}

// API Response types
export type HouseholdResponse = ApiResponse<Household>;
export type HouseholdsResponse = PaginatedResponse<Household>;

export interface GetHouseholdsParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    centerId?: number;
}
