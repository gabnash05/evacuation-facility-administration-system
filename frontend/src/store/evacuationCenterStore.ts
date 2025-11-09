import { create } from "zustand";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import type { EvacuationCenter, CentersResponse } from "@/types/center";

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
    updateCenter: (
        id: number,
        updates: Partial<EvacuationCenter>,
        photo?: File | "remove"
    ) => Promise<void>; // Update this line
    deleteCenter: (id: number) => Promise<void>;
    resetState: () => void;
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
            await EvacuationCenterService.createCenter(center, photo);
            await get().fetchCenters(); // Refresh the list
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
            await EvacuationCenterService.updateCenter(id, updates, photo);
            await get().fetchCenters(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update center");
        }
    },

    deleteCenter: async (id: number) => {
        try {
            await EvacuationCenterService.deleteCenter(id);
            
            // Get current state to check pagination
            const { centers, currentPage} = get();
            
            // If this was the last item on the current page and we're not on page 1
            if (centers.length === 1 && currentPage > 1) {
                // Decrement the page before fetching
                set({ currentPage: currentPage - 1 });
            }
            
            await get().fetchCenters(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete center");
        }
    },

    resetState: () => set(initialState),
}));
