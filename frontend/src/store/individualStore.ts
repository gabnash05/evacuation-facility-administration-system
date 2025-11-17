import { create } from "zustand";
import { IndividualService } from "@/services/individualService";
import type { Individual, IndividualsResponse } from "@/types/individual";

interface IndividualState {
    individuals: Individual[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
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
    addIndividual: (data: any) => Promise<void>;
    updateIndividual: (id: number, data: any) => Promise<void>;
    deleteIndividuals: (ids: number[]) => Promise<void>;
    fetchByHousehold: (household_id: number) => Promise<void>;
    resetState: () => void;
}

const initialState = {
    individuals: [] as Individual[],
    loading: false,
    error: null as string | null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
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
            } as any);

            set({
                individuals: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to fetch individuals",
                loading: false,
                individuals: [],
                pagination: null,
            });
        }
    },

    addIndividual: async (data: any) => {
        try {
            await IndividualService.createIndividual(data);
            await get().fetchIndividuals();
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Failed to add individual");
        }
    },

    updateIndividual: async (id: number, data: any) => {
        try {
            await IndividualService.updateIndividual(id, data);
            await get().fetchIndividuals();
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : "Failed to update individual");
        }
    },

    deleteIndividuals: async (ids: number[]) => {
        try {
            await IndividualService.deleteIndividuals(ids);
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
            // response.data expected to be array
            set({ individuals: response.data, loading: false, pagination: null });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Failed to fetch household individuals", loading: false });
        }
    },

    resetState: () => set(initialState),
}));
