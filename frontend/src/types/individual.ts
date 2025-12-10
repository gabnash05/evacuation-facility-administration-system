// Types
export type IndividualStatus = 'checked_in' | 'checked_out' | 'transferred' | 'all';
export type GenderType = 'Male' | 'Female' | 'Other' | 'all';
export type AgeGroupType = 'child' | 'young_adult' | 'middle_aged' | 'senior' | 'all';

export interface Household {
    household_id: number;
    household_name?: string;
    address?: string;
    center_id?: number;
    household_head_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface IndividualFilterParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    household_id?: number;
    status?: IndividualStatus;
    gender?: GenderType;
    age_group?: AgeGroupType;
    center_id?: number;
}

export interface Individual {
    individual_id: number;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
    relationship_to_head: string;
    household_id: number;
    current_status: string;
    age?: string | number;
    age_group?: string;
    // Center information
    current_center_id?: number;
    current_center_name?: string;
    // Household information
    household?: Household;
    household_name?: string; // From household.household_name
    // Time information
    last_check_in_time?: string;
    created_at: string;
    updated_at: string;
    // Additional calculated fields
    full_name?: string;
    // For compatibility with old type
    household_number?: string;
    current_center_details?: {
        center_id: number;
        name: string;
        center_type?: string;
        check_in_time: string;
    };
    attendance_summary?: {
        total_checkins: number;
        total_checkouts: number;
        total_transfers: number;
        average_stay_duration?: number;
    };
}

export interface PaginationMeta {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
}

export interface FilterMeta {
    applied_filters: {
        status?: string;
        gender?: string;
        age_group?: string;
        center_id?: number;
        household_id?: number;
        search?: string;
    };
    status_summary?: StatusSummaryData;
}

export interface StatusSummaryData {
    [key: string]: {
        count: number;
        centers?: {
            [center_name: string]: number;
        };
    };
}

export interface IndividualsResponse {
    success: boolean;
    message: string;
    data: {
        results: Individual[];
        pagination: PaginationMeta;
        filters: FilterMeta;
    };
}

export interface IndividualResponse {
    success: boolean;
    message: string;
    data: Individual;
}

export interface StatusSummaryResponse {
    success: boolean;
    message: string;
    data: {
        summary: StatusSummaryData;
        total_individuals: number;
        filters_applied: {
            center_id?: number;
            event_id?: number;
        };
    };
}

export interface SearchResponse {
    success: boolean;
    message: string;
    data: Individual[];
}

export interface CreateIndividualData {
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: GenderType;
    relationship_to_head: string;
    household_id: number;
}

export interface UpdateIndividualData {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: GenderType;
    relationship_to_head?: string;
}