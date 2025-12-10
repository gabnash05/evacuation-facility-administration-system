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

export const DistributionService = {
    // Fetch history (accepts search params)
    async getHistory(params: { search?: string; page?: number; limit?: number; center_id?: number } = {}) {
        try {
            const response = await api.get<{ success: boolean; data: DistributionRecord[] }>("/distributions/history", {
                params,
                withCredentials: true
            });
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

    // Delete a record (Super Admin only)
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

    // Fetch allocations (Inventory) for the dropdown
    // Note: If your groupmate hasn't built this endpoint yet, this part might fail or return empty.
    async getAllocations(center_id?: number) {
        try {
            // Assuming your groupmate will build this route. 
            // If it doesn't exist yet, we might need to keep the mock data for this specific part.
            const response = await api.get("/allocations", {
                params: { center_id },
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.warn("Could not fetch allocations (Backend might not be ready)", error);
            return { data: [] };
        }
    }
};