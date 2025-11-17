import { api, handleApiError } from "./api";
import type { IndividualsResponse, IndividualResponse } from "@/types/individual";
import type { CreateIndividualData, UpdateIndividualData } from "@/types/individual";

export class IndividualService {
    static async getIndividuals(params = {}): Promise<IndividualsResponse> {
        try {
            const response = await api.get<IndividualsResponse>("/individuals", {
                params,
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

    static async updateIndividual(id: number, data: UpdateIndividualData): Promise<IndividualResponse> {
        try {
            const response = await api.put<IndividualResponse>(`/individuals/${id}`, data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteIndividuals(ids: number[]): Promise<{ success: boolean; message?: string; data?: { deleted_ids: number[] } }> {
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

    static async getByHousehold(household_id: number): Promise<{ success: boolean; data: any }> {
        try {
            const response = await api.get(`/households/${household_id}/individuals`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}
