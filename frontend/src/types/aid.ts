// src/types/aid.ts
import type { ApiResponse, PaginatedResponse, SearchParams } from "./api";

// Allocation related types
export type AllocationStatus = "active" | "depleted" | "cancelled";
export type DistributionStatus = "delivered" | "pending";
export type DistributionType = "per_household" | "per_individual";

export interface AidCategory {
    category_id: number;
    category_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface Allocation {
    allocation_id: number;
    category_id: number;
    center_id: number;
    event_id: number;
    resource_name: string;
    description?: string;
    total_quantity: number;
    remaining_quantity: number;
    distribution_type: DistributionType;
    suggested_amount?: number;
    status: AllocationStatus;
    allocated_by_user_id: number;
    notes?: string;
    created_at: string;
    updated_at?: string;
    
    // Joined fields (from backend queries)
    category_name: string;
    center_name?: string;
    event_name?: string;
    allocated_by?: string;
}

export interface DistributionSession {
    session_id: number;
    household_id: number;
    distributed_by_user_id: number;
    center_id: number;
    event_id: number;
    session_notes?: string;
    created_at: string;
    
    // Joined fields
    household_name?: string;
    center_name?: string;
    event_name?: string;
    distributed_by?: string;
}

export interface Distribution {
    distribution_id: number;
    session_id: number;
    allocation_id: number;
    quantity_distributed: number;
    distribution_notes?: string;
    created_at: string;
    
    // Joined fields
    resource_name?: string;
    category_name?: string;
    household_name?: string;
    center_name?: string;
    distributed_by?: string;
    status?: DistributionStatus;

    // Backend returns distribution_date (ds.created_at aliased) in list endpoints.
    // Add as optional so components can read distribution.distribution_date safely.
    distribution_date?: string;
}

// Form data types
export interface CreateAllocationData {
    center_id: number;
    event_id: number;
    category_id: number;
    resource_name: string;
    description?: string;
    total_quantity: number;
    distribution_type: DistributionType;
    suggested_amount?: number;
    notes?: string;
}

export interface UpdateAllocationData {
    resource_name?: string;
    description?: string;
    total_quantity?: number;
    distribution_type?: DistributionType;
    suggested_amount?: number;
    status?: AllocationStatus;
    notes?: string;
}

export interface CreateDistributionSessionData {
    household_id: number;
    center_id: number;
    event_id: number;
    distributions: {
        allocation_id: number;
        quantity_distributed: number;
        notes?: string;
    }[];
    session_notes?: string;
}

export interface AddDistributionToSessionData {
    session_id: number;
    allocation_id: number;
    quantity_distributed: number;
    distribution_notes?: string;
}

// Dashboard/Summary types
export interface AllocationSummary {
    total_allocated: number;
    total_distributed: number;
    total_remaining: number;
    active_allocations: number;
    depleted_allocations: number;
}

export interface CenterAllocationStats {
    center_id: number;
    center_name: string;
    total_allocated: number;
    total_distributed: number;
    remaining_by_category: {
        category_name: string;
        remaining_quantity: number;
    }[];
}

// API Request params
export interface GetAllocationsParams extends SearchParams {
    center_id?: number;
    category_id?: number;
    status?: AllocationStatus;
}

export interface GetDistributionsParams extends SearchParams {
    center_id?: number;
    household_id?: number;
    allocation_id?: number;
    status?: DistributionStatus;
}

// API Response types
export type AidCategoriesResponse = ApiResponse<AidCategory[]>;
export type AllocationResponse = ApiResponse<Allocation>;
export type AllocationsResponse = PaginatedResponse<Allocation>;
export type DistributionResponse = ApiResponse<Distribution>;
export type DistributionsResponse = PaginatedResponse<Distribution>;
export type DistributionSessionResponse = ApiResponse<DistributionSession>;
export type DistributionSessionsResponse = PaginatedResponse<DistributionSession>;