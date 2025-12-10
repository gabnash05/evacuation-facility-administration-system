// src/store/aidAllocationStore.ts
import { create } from "zustand";
import { AidAllocationService } from "../services/aidAllocationService";
import type {
    Allocation,
    GetAllocationsParams,
    CreateAllocationData,
    UpdateAllocationData,
    AllocationResponse,
    AllocationsResponse
} from "@/types/aid";

interface AidAllocationState {
    // Allocations state
    allocations: Allocation[];
    allocationsLoading: boolean;
    allocationsError: string | null;

    // Unified loading/error for backward compatibility
    loading: boolean;
    error: string | null;

    // UI state
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;

    // Pagination
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

    // Allocations actions
    fetchAllocations: () => Promise<void>;
    fetchCenterAllocations: (centerId: number) => Promise<void>;
    createAllocation: (data: CreateAllocationData) => Promise<AllocationResponse>;
    updateAllocation: (id: number, updates: UpdateAllocationData) => Promise<AllocationResponse>;
    deleteAllocation: (id: number) => Promise<AllocationResponse>;

    // Reset
    resetAllocationState: () => void;
    resetState: () => void; // Added for compatibility
}

const initialState = {
    // Allocations
    allocations: [],
    allocationsLoading: false,
    allocationsError: null,

    // Unified
    loading: false,
    error: null,

    // UI
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,

    // Pagination
    pagination: null,
};

export const useAidAllocationStore = create<AidAllocationState>((set, get) => ({
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

    setSortConfig: (config) => {
        set({ sortConfig: config, currentPage: 1 });
    },

    // ============ ALLOCATIONS ============
    fetchAllocations: async () => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig } = get();

        set({ allocationsLoading: true, allocationsError: null, loading: true, error: null });

        try {
            const params: GetAllocationsParams = {
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
            };

            console.log("Fetching allocations with params:", params);
            const response: AllocationsResponse = await AidAllocationService.getAllocations(params);
            console.log("Allocations response:", response);

            set({
                allocations: response.data.results,
                pagination: response.data.pagination,
                allocationsLoading: false,
                loading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch allocations";
            console.error("Error fetching allocations:", message, error);
            set({
                allocationsError: message,
                allocationsLoading: false,
                loading: false,
                error: message,
                allocations: [],
                pagination: null,
            });
        }
    },

    createAllocation: async (data: CreateAllocationData) => {
        set({ allocationsLoading: true, allocationsError: null });

        try {
            const response: AllocationResponse = await AidAllocationService.createAllocation(data);

            // Refresh allocations
            await get().fetchAllocations();

            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create allocation";
            set({ allocationsError: message, allocationsLoading: false });
            throw error;
        }
    },

    updateAllocation: async (id: number, updates: UpdateAllocationData) => {
        set({ allocationsLoading: true, allocationsError: null });

        try {
            const response: AllocationResponse = await AidAllocationService.updateAllocation(id, updates);

            // Refresh allocations
            await get().fetchAllocations();

            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update allocation";
            set({ allocationsError: message, allocationsLoading: false });
            throw error;
        }
    },

    deleteAllocation: async (id: number) => {
        set({ allocationsLoading: true, allocationsError: null });

        try {
            const response: AllocationResponse = await AidAllocationService.deleteAllocation(id);
            
            // Check if the delete was successful
            if (!response.success) {
                throw new Error(response.message || "Failed to delete allocation");
            }

            // Get current state to check pagination
            const { allocations, currentPage } = get();

            // If this was the last item on the current page and we're not on page 1
            if (allocations.length === 1 && currentPage > 1) {
                // Decrement the page before fetching
                set({ currentPage: currentPage - 1 });
            }

            // Refresh allocations
            await get().fetchAllocations();

            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete allocation";
            set({ allocationsError: message, allocationsLoading: false });
            throw error;
        }
    },

    // Center-specific fetch methods
    fetchCenterAllocations: async (centerId: number) => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig } = get();
        set({ allocationsLoading: true, allocationsError: null, loading: true, error: null });

        try {
            const params: Omit<GetAllocationsParams, 'center_id'> = {
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
            };

            console.log(`[DEBUG] Fetching center allocations for center: ${centerId}`);
            const response: AllocationsResponse = await AidAllocationService.getCenterAllocations(centerId, params);

            set({
                allocations: response.data.results,
                pagination: response.data.pagination,
                allocationsLoading: false,
                loading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch allocations";
            console.error(`[ERROR] fetchCenterAllocations error: ${message}`, error);
            set({
                allocationsError: message,
                allocationsLoading: false,
                loading: false,
                error: message,
                allocations: [],
                pagination: null,
            });
        }
    },

    resetAllocationState: () => set(initialState),
    resetState: () => set(initialState), // Added alias for compatibility
}));