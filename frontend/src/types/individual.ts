import type { ApiResponse, PaginatedResponse } from "./api";
import type { Household } from "./households";

export type Gender = "Male" | "Female" | "Other";

export interface Individual {
    individual_id: number;
    household_id: number;
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    gender?: Gender | null;
    relationship_to_head: string;
    created_at: string;
    updated_at?: string;
    // Optional joined fields
    household?: Household;
}

export interface CreateIndividualData {
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_to_head: string;
    household_id: number;
}

export interface UpdateIndividualData {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: Gender;
    relationship_to_head?: string;
    household_id?: number;
}

// API Response types
export type IndividualResponse = ApiResponse<Individual>;
export type IndividualsResponse = PaginatedResponse<Individual>;
