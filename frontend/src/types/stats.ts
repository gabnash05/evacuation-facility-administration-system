import type { ApiResponse } from "./api";

export type Gender = "Male" | "Female" | "Other";
export type AgeGroup = "Child" | "Teen" | "Adult" | "Senior";

export interface StatsFilter {
    gender?: Gender | null;
    age_group?: AgeGroup | null;
    center_id?: number | null;
}

export interface OccupancyStats {
    current_occupancy: number;
    total_capacity: number;
    percentage: number;
}

export interface RegistrationStats {
    total_check_ins: number;
    total_registered: number;
    percentage: number;
}

export interface AidDistributionStats {
    total_distributed: number;
    total_allocated: number;
    percentage: number;
}

export interface DashboardStats {
    occupancy_stats: OccupancyStats;
    registration_stats: RegistrationStats;
    aid_distribution_stats: AidDistributionStats;
}

// API Response types
export type DashboardStatsResponse = ApiResponse<DashboardStats>;
export type OccupancyStatsResponse = ApiResponse<OccupancyStats>;
export type RegistrationStatsResponse = ApiResponse<RegistrationStats>;
export type AidDistributionStatsResponse = ApiResponse<AidDistributionStats>;

// UI Display types
export interface StatDisplay {
    label: string;
    value: string;
    max: string;
    percentage: number;
}