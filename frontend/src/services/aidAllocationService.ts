// src/services/aidAllocationService.ts
import { api, handleApiError } from "./api";
import type {
    AidCategoriesResponse,
    AllocationResponse,
    AllocationsResponse,
    CreateAllocationData,
    UpdateAllocationData,
    GetAllocationsParams,
} from "@/types/aid";

export class AidAllocationService {
    // ============ AID CATEGORIES ============
    static async getCategories(): Promise<AidCategoriesResponse> {
        try {
            const response = await api.get<AidCategoriesResponse>("/aid-categories", {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============ ALLOCATIONS ============
    static async getAllocations(params: GetAllocationsParams = {}): Promise<AllocationsResponse> {
        try {
            console.log("Fetching allocations with params:", params);
            const response = await api.get<AllocationsResponse>("/allocations", {
                params: {
                    ...params,
                    sort_by: params.sortBy,
                    sort_order: params.sortOrder,
                },
                withCredentials: true,
            });
            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("API Error:", error);
            throw new Error(handleApiError(error));
        }
    }

    static async getAllocationById(id: number): Promise<AllocationResponse> {
        try {
            const response = await api.get<AllocationResponse>(`/allocations/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createAllocation(data: CreateAllocationData): Promise<AllocationResponse> {
        try {
            const response = await api.post<AllocationResponse>("/allocations", data, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateAllocation(id: number, updates: UpdateAllocationData): Promise<AllocationResponse> {
        try {
            const response = await api.put<AllocationResponse>(`/allocations/${id}`, updates, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteAllocation(id: number): Promise<AllocationResponse> {
        try {
            const response = await api.delete<AllocationResponse>(`/allocations/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============ CENTER-SPECIFIC ENDPOINTS ============
    static async getCenterAllocations(
        centerId: number, 
        params: Omit<GetAllocationsParams, 'center_id'> = {}
    ): Promise<AllocationsResponse> {
        try {
            const response = await api.get<AllocationsResponse>(`/allocations/center/${centerId}`, {
                params: {
                    ...params,
                    sort_by: params.sortBy,  // ADD THIS TRANSFORMATION
                    sort_order: params.sortOrder,  // ADD THIS TRANSFORMATION
                },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============ QUICK STATS/SUMMARY ============
    static async getAllocationSummary(): Promise<{
        success: boolean;
        data: {
            total_allocated: number;
            total_distributed: number;
            total_remaining: number;
            active_allocations: number;
            depleted_allocations: number;
        };
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    total_allocated: number;
                    total_distributed: number;
                    total_remaining: number;
                    active_allocations: number;
                    depleted_allocations: number;
                };
            }>("/allocations/summary", {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCenterAllocationStats(centerId: number): Promise<{
        success: boolean;
        data: {
            center_id: number;
            center_name: string;
            total_allocated: number;
            total_distributed: number;
            remaining_by_category: {
                category_name: string;
                remaining_quantity: number;
            }[];
        };
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    center_id: number;
                    center_name: string;
                    total_allocated: number;
                    total_distributed: number;
                    remaining_by_category: {
                        category_name: string;
                        remaining_quantity: number;
                    }[];
                };
            }>(`/allocations/center/${centerId}/stats`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ============ BULK OPERATIONS ============
    static async bulkCreateAllocations(data: CreateAllocationData[]): Promise<AllocationResponse[]> {
        try {
            const response = await api.post<AllocationResponse[]>("/allocations/bulk", data, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}