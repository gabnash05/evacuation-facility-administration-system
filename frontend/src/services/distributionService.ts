import { api, handleApiError } from "./api";
import type { DistributionRecord } from "@/types/distribution";

// Define the payload structure for creating a distribution
interface CreateDistributionPayload {
    household_id: number;
    items: {
        allocation_id: number;
        quantity: number;
    }[];
    notes?: string;
}

export interface GetHistoryParams {
    search?: string;
    page?: number;
    limit?: number;
    center_id?: number;
    sort_by?: string; // NEW
    sort_order?: "asc" | "desc"; // NEW
}

export const DistributionService = {
    // Fetch history (accepts search params)
    async getHistory(params: GetHistoryParams = {}) {
        try {
            const { search, page, limit, center_id, sort_by, sort_order } = params;
        
            const queryParams = new URLSearchParams();
            if (search) queryParams.append("search", search);
            if (page) queryParams.append("page", page.toString());
            if (limit) queryParams.append("limit", limit.toString());
            if (center_id) queryParams.append("center_id", center_id.toString());
            if (sort_by) queryParams.append("sort_by", sort_by); // NEW
            if (sort_order) queryParams.append("sort_order", sort_order); // NEW
            
            const response = await api.get(`/distributions/history?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Create new distribution record
    async create(payload: CreateDistributionPayload) {
        try {
            const response = await api.post("/distributions", payload, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Delete a record
    async delete(id: number) {
        try {
            const response = await api.delete(`/distributions/${id}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },

    // Fetch allocations (Real Inventory)
    // FIX: Using the URL from aid_allocation.py
    async getAllocations(center_id?: number) {
        try {
            const response = await api.get("/allocations", {
                params: { center_id },
                withCredentials: true
            });
            // The route returns { success: true, data: { results: [...] } }
            // So we need to return response.data.data.results
            return response.data; 
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    },
    

    async update(id: number, payload: { household_id: number; allocation_id: number; quantity: number }) {
        try {
            const response = await api.put(`/distributions/${id}`, payload, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
};