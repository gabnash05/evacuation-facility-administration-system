import { create } from "zustand";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import type { 
    EvacuationCenter, 
    CentersResponse, 
    CitySummary 
} from "@/types/center";

interface EvacuationCenterState {
    centers: EvacuationCenter[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;
    citySummary: CitySummary | null;
    mapCenters: EvacuationCenter[]; // Centers for map display
    nearbyCenters: (EvacuationCenter & { distance_km?: number })[]; // Centers with distance info
    uploadProgress: number | null; // For S3 upload progress

    // Actions
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    fetchCenters: () => Promise<void>;
    addCenter: (
        center: Omit<EvacuationCenter, "center_id" | "created_at" | "updated_at">,
        photo?: File
    ) => Promise<void>;
    
    uploadPhotoToS3: (file: File) => Promise<{ s3Key: string; uploadUrl: string }>;
    addCenterWithS3Photo: (
        center: Omit<EvacuationCenter, "center_id" | "created_at" | "updated_at">,
        s3Key: string,
        fileType: string
    ) => Promise<void>;
    
    updateCenter: (
        id: number,
        updates: Partial<EvacuationCenter>,
        photo?: File | "remove"
    ) => Promise<void>;
    deleteCenter: (id: number) => Promise<void>;
    resetState: () => void;
    fetchAllCenters: () => Promise<void>;
    fetchCitySummary: () => Promise<void>;
    fetchCentersByProximity: (
        latitude: number,
        longitude: number,
        radius?: number,
        limit?: number
    ) => Promise<void>;
    fetchCentersInBounds: (
        bounds: { north: number; south: number; east: number; west: number },
        status?: string
    ) => Promise<void>;
    fetchCenterById: (id: number) => Promise<EvacuationCenter | null>;
    fetchCenterEvents: (centerId: number) => Promise<any[]>;
}

const initialState = {
    centers: [],
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    pagination: null,
    citySummary: null,
    mapCenters: [],
    nearbyCenters: [],
    uploadProgress: null,
};

export const useEvacuationCenterStore = create<EvacuationCenterState>((set, get) => ({
    ...initialState,

    setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
    },

    setCurrentPage: (page: number) => {
        set({ currentPage: page });
    },

    setEntriesPerPage: (entries: number) => {
        set({ entriesPerPage: entries, currentPage: 1 });
    },

    setSortConfig: config => {
        set({ sortConfig: config, currentPage: 1 });
    },

    fetchCenters: async () => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig } = get();

        set({ loading: true, error: null });

        try {
            const response: CentersResponse = await EvacuationCenterService.getCenters({
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
            });

            set({
                centers: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch centers",
                loading: false,
                centers: [],
                pagination: null,
            });
        }
    },

    addCenter: async (
        center: Omit<EvacuationCenter, "center_id" | "created_at" | "updated_at">,
        photo?: File
    ) => {
        try {
            const centerData = {
                center_name: center.center_name,
                address: center.address,
                latitude: center.latitude,
                longitude: center.longitude,
                capacity: center.capacity,
                current_occupancy: center.current_occupancy || 0,
                status: center.status || "active",
            };
            
            await EvacuationCenterService.createCenter(centerData, photo);
            await get().fetchCenters();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to add center");
        }
    },

    uploadPhotoToS3: async (file: File) => {
        set({ uploadProgress: 0, error: null });
        
        try {
            const uploadUrlResponse = await EvacuationCenterService.getUploadUrl(
                file.name,
                file.type
            );
            
            if (!uploadUrlResponse.success) {
                throw new Error(uploadUrlResponse.message || "Failed to get upload URL");
            }
            
            const { uploadUrl, s3Key } = uploadUrlResponse.data;
            
            await EvacuationCenterService.uploadFileToS3(uploadUrl, file, (progress: number) => {
                set({ uploadProgress: progress });
            });
            
            set({ uploadProgress: null });
            
            return { s3Key, uploadUrl };
        } catch (error) {
            set({ uploadProgress: null });
            throw error;
        }
    },

    addCenterWithS3Photo: async (
        center: Omit<EvacuationCenter, "center_id" | "created_at" | "updated_at">,
        s3Key: string,
        fileType: string
    ) => {
        try {
            const centerData = {
                center_name: center.center_name,
                address: center.address,
                latitude: center.latitude,
                longitude: center.longitude,
                capacity: center.capacity,
                current_occupancy: center.current_occupancy || 0,
                status: center.status || "active",
                s3Key: s3Key,
                fileName: s3Key.split('/').pop(),
                fileType: fileType
            };
            
            await EvacuationCenterService.createCenterWithS3Key(centerData);
            await get().fetchCenters();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to add center");
        }
    },

    updateCenter: async (
        id: number,
        updates: Partial<EvacuationCenter>,
        photo?: File | "remove"
    ) => {
        try {
            const updateData: any = {};
            if (updates.center_name !== undefined) updateData.center_name = updates.center_name;
            if (updates.address !== undefined) updateData.address = updates.address;
            if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
            if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
            if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
            if (updates.current_occupancy !== undefined) updateData.current_occupancy = updates.current_occupancy;
            if (updates.status !== undefined) updateData.status = updates.status;
            
            await EvacuationCenterService.updateCenter(id, updateData, photo);
            await get().fetchCenters();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update center");
        }
    },

    deleteCenter: async (id: number) => {
        try {
            await EvacuationCenterService.deleteCenter(id);

            const { centers, currentPage } = get();

            if (centers.length === 1 && currentPage > 1) {
                set({ currentPage: currentPage - 1 });
            }

            await get().fetchCenters();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete center");
        }
    },

    fetchAllCenters: async () => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getAllCenters();

            set({
                centers: response.data,
                mapCenters: response.data,
                loading: false,
                pagination: null,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch centers",
                loading: false,
                centers: [],
                mapCenters: [],
                pagination: null,
            });
        }
    },

    fetchCitySummary: async () => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getCitySummary();
            
            if (response.success) {
                set({
                    citySummary: response.data,
                    loading: false,
                });
            } else {
                set({
                    error: "Failed to fetch city summary",
                    loading: false,
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch city summary",
                loading: false,
                citySummary: null,
            });
        }
    },

    fetchCentersByProximity: async (
        latitude: number,
        longitude: number,
        radius: number = 10.0,
        limit: number = 10
    ) => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getCentersByProximity(
                latitude,
                longitude,
                radius,
                limit
            );
            
            if (response.success) {
                set({
                    nearbyCenters: response.data,
                    loading: false,
                });
            } else {
                set({
                    error: response.message || "Failed to fetch nearby centers",
                    loading: false,
                    nearbyCenters: [],
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch nearby centers",
                loading: false,
                nearbyCenters: [],
            });
        }
    },

    fetchCentersInBounds: async (
        bounds: { north: number; south: number; east: number; west: number },
        status: string = "active"
    ) => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getCentersInBounds(bounds, status);
            
            if (response.success) {
                set({
                    mapCenters: response.data,
                    loading: false,
                });
            } else {
                set({
                    error: response.message || "Failed to fetch centers in bounds",
                    loading: false,
                    mapCenters: [],
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch centers in bounds",
                loading: false,
                mapCenters: [],
            });
        }
    },

    fetchCenterById: async (id: number): Promise<EvacuationCenter | null> => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getCenterById(id);
            
            if (response.success) {
                set({ loading: false });
                return response.data;
            } else {
                set({
                    error: "Failed to fetch center",
                    loading: false,
                });
                return null;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch center",
                loading: false,
            });
            return null;
        }
    },

    fetchCenterEvents: async (centerId: number): Promise<any[]> => {
        set({ loading: true, error: null });

        try {
            const response = await EvacuationCenterService.getCenterEvents(centerId);
            
            if (response.success) {
                set({ loading: false });
                return response.data;
            } else {
                set({
                    error: "Failed to fetch center events",
                    loading: false,
                });
                return [];
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch center events",
                loading: false,
            });
            return [];
        }
    },

    resetState: () => set(initialState),
}));