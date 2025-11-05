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

    static async createCenter(data: CreateCenterFormData, photo?: File): Promise<CentersResponse> {
        try {
            const formData = new FormData();
            
            // Append form data
            formData.append('center_name', data.center_name);
            formData.append('address', data.address);
            formData.append('capacity', data.capacity.toString());
            formData.append('current_occupancy', (data.current_occupancy || 0).toString());
            formData.append('status', data.status || 'active');
            
            // Append photo if provided
            if (photo) {
                formData.append('photo', photo);
            }

            const response = await api.post<CentersResponse>("/evacuation_centers", formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateCenter(id: number, updates: UpdateCenterFormData, photo?: File | 'remove'): Promise<CentersResponse> {
        try {
            const formData = new FormData();
            
            // Append form data (only provided fields)
            if (updates.center_name) formData.append('center_name', updates.center_name);
            if (updates.address) formData.append('address', updates.address);
            if (updates.capacity) formData.append('capacity', updates.capacity.toString());
            if (updates.current_occupancy !== undefined) formData.append('current_occupancy', updates.current_occupancy.toString());
            if (updates.status) formData.append('status', updates.status);
            
            // Handle photo: file upload or removal - FIXED
            if (photo === 'remove') {
                formData.append('remove_photo', 'true');
            } else if (photo && photo instanceof File) {
                formData.append('photo', photo);
            }
            // If photo is undefined, don't append anything (keeps existing photo)

            const response = await api.put<CentersResponse>(`/evacuation_centers/${id}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
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