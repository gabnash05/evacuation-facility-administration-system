import type { ApiResponse, PaginatedResponse } from "./api";
import type { Household } from "./households";

export type Gender = "Male" | "Female" | "Other";

export interface Individual {
    individualId: number;
    householdId: number;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: Gender | null;
    relationshipToHead: string;
    createdAt: string;
    updatedAt?: string;
    // Optional joined fields
    household?: Household;
}

export interface CreateIndividualData {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: Gender;
    relationshipToHead: string;
    householdId: number;
}

export interface UpdateIndividualData {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: Gender;
    relationshipToHead?: string;
    householdId?: number;
}

// API Response types
export type IndividualResponse = ApiResponse<Individual>;
export type IndividualsResponse = PaginatedResponse<Individual>;
