// individualService.ts
import { api, handleApiError } from "./api";
import type { 
  IndividualsResponse, 
  IndividualResponse,
  StatusSummaryResponse,
  SearchResponse 
} from "@/types/individual";
import type { 
  CreateIndividualData, 
  UpdateIndividualData,
  IndividualFilterParams 
} from "@/types/individual";

export class IndividualService {
    static async getIndividuals(params: IndividualFilterParams = {}): Promise<IndividualsResponse> {
        try {
            const queryParams = {
                search: params.search,
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: params.sortBy,
                sortOrder: params.sortOrder,
                household_id: params.household_id,
                status: params.status,
                gender: params.gender,
                age_group: params.age_group,
                center_id: params.center_id,
            };

            const cleanedParams = Object.fromEntries(
                Object.entries(queryParams).filter(([_, value]) => value !== undefined && value !== null)
            );

            const response = await api.get<IndividualsResponse>("/individuals", {
                params: cleanedParams,
                withCredentials: true,
            });
            
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getIndividualById(id: number): Promise<IndividualResponse> {
        try {
            const response = await api.get<IndividualResponse>(`/individuals/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createIndividual(data: CreateIndividualData): Promise<IndividualResponse> {
        try {
            const response = await api.post<IndividualResponse>("/individuals", data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateIndividual(
        id: number,
        data: UpdateIndividualData
    ): Promise<IndividualResponse> {
        try {
            const response = await api.put<IndividualResponse>(`/individuals/${id}`, data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteIndividuals(
        ids: number[]
    ): Promise<{ success: boolean; message?: string; data?: { deleted_ids: number[] } }> {
        try {
            const response = await api.delete("/individuals", {
                withCredentials: true,
                data: { ids },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getByHousehold(household_id: number): Promise<{ success: boolean; data: any, message: string }> {
        try {
            const response = await api.get(`/households/${household_id}/individuals`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getStatusSummary(params: { center_id?: number; event_id?: number } = {}): Promise<StatusSummaryResponse> {
        try {
            const cleanedParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
            );

            const response = await api.get<StatusSummaryResponse>("/individuals/status-summary", {
                params: cleanedParams,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async searchIndividuals(name: string, limit: number = 10): Promise<SearchResponse> {
        try {
            const response = await api.get<SearchResponse>("/individuals/search", {
                params: { name, limit },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async recalculateStatuses(): Promise<{ 
        success: boolean; 
        message: string; 
        data?: { 
            updates: any[]; 
            total_updated: number 
        } 
    }> {
        try {
            const response = await api.post("/individuals/recalculate-statuses", {}, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}
