import { api, handleApiError } from "./api";
import type { CentersResponse, GetCentersParams } from '@/types/center';
import type { CreateCenterFormData, UpdateCenterFormData } from "@/schemas/centers";

export class EvacuationCenterService {
    static async getCenters(params: GetCentersParams = {}): Promise<CentersResponse> {
        try {
            const response = await api.get<CentersResponse>("/evacuation_centers", {
                params,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCenterById(id: number): Promise<CentersResponse> {
        try {
            const response = await api.get<CentersResponse>(`/evacuation_centers/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createCenter(data: CreateCenterFormData): Promise<CentersResponse> {
        try {
            const response = await api.post<CentersResponse>("/evacuation_centers", data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateCenter(id: number, updates: UpdateCenterFormData): Promise<CentersResponse> {
        try {
            const response = await api.put<CentersResponse>(`/evacuation_centers/${id}`, updates, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteCenter(id: number): Promise<CentersResponse> {
        try {
            const response = await api.delete<CentersResponse>(`/evacuation_centers/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}