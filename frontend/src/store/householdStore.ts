import { create } from "zustand";
import type { Household, CreateHouseholdData, UpdateHouseholdData } from "@/types/households";
import { HouseholdService } from "@/services/householdService";
import type { Individual } from "@/types/individual";

interface HouseholdState {
    households: Household[];
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
    fetchHouseholds: (centerId?: number) => Promise<void>;
    createHousehold: (householdData: CreateHouseholdData) => Promise<number>; // Returns household ID
    createHouseholdWithIndividuals: (householdData: CreateHouseholdData) => Promise<void>;
    updateHousehold: (id: number, householdData: UpdateHouseholdData) => Promise<void>;
    deleteHousehold: (id: number) => Promise<void>;
    getHouseholdDetails: (id: number) => Promise<Household>;
    getHouseholdIndividuals: (householdId: number) => Promise<Individual[]>;
    resetState: () => void;
}

const initialState = {
    households: [],
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    pagination: null,
};

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
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

    fetchHouseholds: async (centerId?: number) => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig } = get();

        set({ loading: true, error: null });

        try {
            const response = await HouseholdService.getHouseholds({
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
                centerId: centerId,
            });

            set({
                households: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch households",
                loading: false,
                households: [],
                pagination: null,
            });
        }
    },

    createHousehold: async (householdData: CreateHouseholdData): Promise<number> => {
        try {
            const response = await HouseholdService.createHousehold(householdData);
            if (!response || !response.data) {
                throw new Error("Failed to create household: No data returned");
            }
            // response is ApiResponse<Household> shape: { success, message, data }
            const created = (response as any).data?.data ?? (response as any).data;
            // created now should be the household object
            const id = created?.household_id ?? created?.householdId ?? created?.id;
            if (!id) throw new Error("Failed to read created household id from response");
            return id;
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create household");
        }
    },

    createHouseholdWithIndividuals: async (householdData: CreateHouseholdData) => {
        try {
            // Use the backend's single endpoint to create household and individuals
            // in one atomic request. HouseholdService.createHousehold already posts
            // to `/households-with-individuals` when `individuals` are present.
            const response = await HouseholdService.createHousehold(householdData as any);
            if (!response.data) {
                throw new Error("Failed to create household with individuals");
            }
            // Refresh the households list
            await get().fetchHouseholds();
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to create household with individuals"
            );
        }
    },

    updateHousehold: async (id: number, householdData: UpdateHouseholdData) => {
        try {
            // Find the head individual from the individuals array
            const headIndividual = householdData.individuals?.find(
                ind => ind.relationship_to_head.toLowerCase() === "head"
            );

            // If we have a head individual with an ID, set the household_head_id
            if (headIndividual?.individual_id) {
                householdData.household_head_id = headIndividual.individual_id;
            }

            await HouseholdService.updateHousehold(id, householdData);
            await get().fetchHouseholds(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update household");
        }
    },

    deleteHousehold: async (id: number) => {
        try {
            await HouseholdService.deleteHousehold(id);
            await get().fetchHouseholds(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete household");
        }
    },

    getHouseholdDetails: async (id: number): Promise<Household> => {
        try {
            const response = await HouseholdService.getHouseholdDetails(id);
            if (!response.data) {
                throw new Error("Household data not found");
            }
            return response.data;
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch household details"
            );
        }
    },

    getHouseholdIndividuals: async (householdId: number): Promise<any[]> => {
        try {
            const response = await HouseholdService.getHouseholdIndividuals(householdId);
            return response.data || [];
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch household individuals"
            );
        }
    },

    resetState: () => set(initialState),
}));
