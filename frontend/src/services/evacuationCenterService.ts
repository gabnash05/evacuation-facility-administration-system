import { api, handleApiError } from "./api";
import type {
    CentersResponse,
    GetCentersParams,
    EvacuationCenter,
    CitySummary,
} from "@/types/center";
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

    // FIXED: getCenterById returns a single center, not paginated response
    static async getCenterById(id: number): Promise<{
        success: boolean;
        message: string;
        data: EvacuationCenter;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                message: string;
                data: EvacuationCenter;
            }>(`/evacuation_centers/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getAllCenters(): Promise<{
        success: boolean;
        data: EvacuationCenter[];
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: EvacuationCenter[];
            }>("/evacuation_centers/all", {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ UPDATED: Original base64 method (kept for backward compatibility)
    static async createCenter(data: CreateCenterFormData, photo?: File): Promise<CentersResponse> {
        try {
            const formData = new FormData();

            // Append form data (including coordinates)
            formData.append("center_name", data.center_name);
            formData.append("address", data.address);
            formData.append("latitude", data.latitude.toString());
            formData.append("longitude", data.longitude.toString());
            formData.append("capacity", data.capacity.toString());
            formData.append("current_occupancy", (data.current_occupancy || 0).toString());
            formData.append("status", data.status || "active");

            // Append photo if provided
            if (photo) {
                formData.append("photo", photo);
            }

            const response = await api.post<CentersResponse>("/evacuation_centers", formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createCenterWithS3Key(data: {
        center_name: string;
        address: string;
        latitude: number;
        longitude: number;
        capacity: number;
        current_occupancy: number;
        status: string;
        s3_key: string;
        file_name?: string;
        file_type?: string;
    }): Promise<CentersResponse> {
        try {
            const response = await api.post<CentersResponse>("/evacuation_centers", data, {
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

    static async getUploadUrl(fileName: string, fileType: string): Promise<{
        success: boolean;
        message?: string;
        data: {
            uploadUrl: string;
            s3Key: string;
            bucket: string;
        };
    }> {
        try {
            const response = await api.post<{
                success: boolean;
                message?: string;
                data: {
                    uploadUrl: string;
                    s3Key: string;
                    bucket: string;
                };
            }>("/evacuation_centers/upload-url", 
                { fileName, fileType },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async uploadFileToS3(
        uploadUrl: string, 
        file: File, 
        onProgress?: (progress: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);
            
            if (onProgress) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        onProgress(progress);
                    }
                };
            }
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => {
                reject(new Error('Network error during upload'));
            };
            
            xhr.ontimeout = () => {
                reject(new Error('Upload timeout'));
            };
            
            xhr.send(file);
        });
    }


    static async getDeleteUrl(s3Key: string): Promise<{
        success: boolean;
        message?: string;
        data: {
            deleteUrl: string;
            s3Key: string;
        };
    }> {
        try {
            const response = await api.post<{
                success: boolean;
                message?: string;
                data: {
                    deleteUrl: string;
                    s3Key: string;
                };
            }>("/evacuation_centers/delete-url", 
                { s3Key },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }


    static async deleteFileFromS3(deleteUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open('DELETE', deleteUrl, true);
            
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 204) {
                    resolve();
                } else {
                    reject(new Error(`Delete failed with status ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => {
                reject(new Error('Network error during delete'));
            };
            
            xhr.send();
        });
    }

    static async updateCenter(
        id: number,
        updates: UpdateCenterFormData,
        photo?: File | "remove"
    ): Promise<CentersResponse> {
        try {
            const formData = new FormData();

            if (updates.center_name) formData.append("center_name", updates.center_name);
            if (updates.address) formData.append("address", updates.address);
            if (updates.latitude !== undefined) formData.append("latitude", updates.latitude.toString());
            if (updates.longitude !== undefined) formData.append("longitude", updates.longitude.toString());
            if (updates.capacity) formData.append("capacity", updates.capacity.toString());
            if (updates.current_occupancy !== undefined)
                formData.append("current_occupancy", updates.current_occupancy.toString());
            if (updates.status) formData.append("status", updates.status);

            if (photo === "remove") {
                formData.append("remove_photo", "true");
            } else if (photo && photo instanceof File) {
                formData.append("photo", photo);
            }

            const response = await api.put<CentersResponse>(`/evacuation_centers/${id}`, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateCenterWithS3Key(
        id: number,
        updates: UpdateCenterFormData & { s3Key?: string; remove_photo?: boolean }
    ): Promise<CentersResponse> {
        try {
            const response = await api.put<CentersResponse>(`/evacuation_centers/${id}`, updates, {
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

    static async getCitySummary(): Promise<{
        success: boolean;
        data: CitySummary;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: CitySummary;
            }>("/evacuation_centers/summary", {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCentersByProximity(
        latitude: number,
        longitude: number,
        radius: number = 10.0,
        limit: number = 10
    ): Promise<{
        success: boolean;
        data: (EvacuationCenter & { distance_km?: number })[];
        message: string;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: (EvacuationCenter & { distance_km?: number })[];
                message: string;
            }>("/evacuation_centers/nearby", {
                params: {
                    lat: latitude,
                    lng: longitude,
                    radius,
                    limit
                },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCentersInBounds(
        bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        },
        status: string = "active"
    ): Promise<{
        success: boolean;
        data: EvacuationCenter[];
        message: string;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: EvacuationCenter[];
                message: string;
            }>("/evacuation_centers/in-bounds", {
                params: {
                    north: bounds.north,
                    south: bounds.south,
                    east: bounds.east,
                    west: bounds.west,
                    status
                },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCenterEvents(centerId: number): Promise<{
        success: boolean;
        data: any[];
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: any[];
            }>(`/evacuation_centers/${centerId}/events`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}