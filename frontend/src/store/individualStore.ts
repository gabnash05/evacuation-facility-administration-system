// store/individualStore.ts
import { create } from "zustand";
import { IndividualService } from "@/services/individualService";
import type { Individual, IndividualsResponse, IndividualResponse } from "@/types/individual";

interface IndividualState {
    individuals: Individual[];
    paginatedIndividuals: Individual[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    totalRecords: number;
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;

    // actions
    setSearchQuery: (q: string) => void;
    setCurrentPage: (p: number) => void;
    setEntriesPerPage: (n: number) => void;
    fetchIndividuals: (opts?: { search?: string; page?: number; limit?: number }) => Promise<void>;
    searchIndividuals: (params: {
        search?: string;
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: string;
        household_id?: number;
    }) => Promise<{ success: boolean; data: Individual[]; pagination: any }>;
    clearSearch: () => void;
    addIndividual: (data: any) => Promise<void>;
    updateIndividual: (id: number, data: any) => Promise<void>;
    deleteIndividuals: (ids: number[]) => Promise<void>;
    fetchByHousehold: (household_id: number) => Promise<void>;
    resetState: () => void;
}

const initialState = {
    individuals: [] as Individual[],
    paginatedIndividuals: [] as Individual[],
    loading: false,
    error: null as string | null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    totalRecords: 0,
    pagination: null as IndividualState["pagination"],
};

export const useIndividualStore = create<IndividualState>((set, get) => ({
    ...initialState,

    setSearchQuery: (q: string) => set({ searchQuery: q, currentPage: 1 }),
    setCurrentPage: (p: number) => set({ currentPage: p }),
    setEntriesPerPage: (n: number) => set({ entriesPerPage: n, currentPage: 1 }),

    fetchIndividuals: async (opts = {}) => {
        set({ loading: true, error: null });
        const search = opts.search ?? get().searchQuery;
        const page = opts.page ?? get().currentPage;
        const limit = opts.limit ?? get().entriesPerPage;

        try {
            const response: IndividualsResponse = await IndividualService.getIndividuals({
                search,
                page,
                limit,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            const individualsData = response.data?.results || [];
            const paginationData = response.data?.pagination;

            set({
                individuals: individualsData,
                paginatedIndividuals: individualsData,
                totalRecords: paginationData?.total_items || 0,
                pagination: paginationData,
                loading: false,
            });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to fetch individuals",
                loading: false,
                individuals: [],
                paginatedIndividuals: [],
                totalRecords: 0,
                pagination: null,
            });
        }
    },

    searchIndividuals: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const response: IndividualsResponse = await IndividualService.getIndividuals({
                search: params.search || "",
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: params.sort_by,
                sortOrder: params.sort_order,
                household_id: params.household_id,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            const individualsData = response.data?.results || [];
            const paginationData = response.data?.pagination;
            
            set({
                paginatedIndividuals: individualsData,
                totalRecords: paginationData?.total_items || individualsData.length,
                currentPage: paginationData?.current_page || 1,
                searchQuery: params.search || "",
                pagination: paginationData,
                loading: false,
            });

            return { 
                success: true, 
                data: individualsData, 
                pagination: paginationData 
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to search individuals";
            set({
                error: errorMessage,
                loading: false,
                paginatedIndividuals: [],
                totalRecords: 0,
            });
            return { success: false, data: [], pagination: null };
        }
    },

    clearSearch: () => {
        set({
            paginatedIndividuals: [],
            searchQuery: "",
            currentPage: 1,
            totalRecords: 0,
            error: null,
        });
    },

    addIndividual: async (data: any) => {
        try {
            const response: IndividualResponse = await IndividualService.createIndividual(data);
            if (!response.success) {
                throw new Error(response.message);
            }
            await get().fetchIndividuals();
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Failed to add individual");
        }
    },

    updateIndividual: async (id: number, data: any) => {
        try {
            const response: IndividualResponse = await IndividualService.updateIndividual(id, data);
            if (!response.success) {
                throw new Error(response.message);
            }
            await get().fetchIndividuals();
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Failed to update individual");
        }
    },

    deleteIndividuals: async (ids: number[]) => {
        try {
            const response = await IndividualService.deleteIndividuals(ids);
            if (!response.success) {
                throw new Error(response.message);
            }
            // after deletion, refresh list. Adjust pagination if needed
            const { individuals, currentPage } = get();
            if (individuals.length === ids.length && currentPage > 1) {
                set({ currentPage: currentPage - 1 });
            }
            await get().fetchIndividuals();
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Failed to delete individuals");
        }
    },

    fetchByHousehold: async (household_id: number) => {
        set({ loading: true, error: null });
        try {
            const response = await IndividualService.getByHousehold(household_id);
            if (!response.success) {
                throw new Error(response.message);
            }
            const data = response.data || [];
            set({ 
                individuals: data, 
                paginatedIndividuals: data,
                loading: false, 
                pagination: null 
            });
        } catch (err) {
            set({ 
                error: err instanceof Error ? err.message : "Failed to fetch household individuals", 
                loading: false 
            });
        }
    },

    resetState: () => set(initialState),
}));