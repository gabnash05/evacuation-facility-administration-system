// store/individualStore.ts
import { create } from "zustand";
import { IndividualService } from "@/services/individualService";
import type { 
    Individual, 
    IndividualsResponse, 
    IndividualResponse,
    IndividualFilterParams,
    StatusSummaryResponse
} from "@/types/individual";

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
    appliedFilters: {
        status?: string;
        gender?: string;
        age_group?: string;
        center_id?: number;
        household_id?: number;
        search?: string;
    };
    statusSummary: {
        summary: Record<string, any>;
        total_individuals: number;
        filters_applied: {
            center_id?: number;
            event_id?: number;
        };
    } | null;

    // actions
    setSearchQuery: (q: string) => void;
    setCurrentPage: (p: number) => void;
    setEntriesPerPage: (n: number) => void;
    setFilter: (filter: keyof IndividualState['appliedFilters'], value: any) => void;
    clearFilters: () => void;
    fetchIndividuals: (params?: IndividualFilterParams) => Promise<void>;
    searchIndividuals: (params: IndividualFilterParams) => Promise<{ success: boolean; data: Individual[]; pagination: any }>;
    clearSearch: () => void;
    addIndividual: (data: any) => Promise<void>;
    updateIndividual: (id: number, data: any) => Promise<void>;
    deleteIndividuals: (ids: number[]) => Promise<void>;
    fetchByHousehold: (household_id: number) => Promise<void>;
    fetchIndividualById: (id: number) => Promise<Individual | null>;
    fetchStatusSummary: (params?: { center_id?: number; event_id?: number }) => Promise<void>;
    searchIndividualsByName: (name: string, limit?: number) => Promise<Individual[]>;
    recalculateStatuses: () => Promise<void>;
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
    appliedFilters: {
        status: undefined,
        gender: undefined,
        age_group: undefined,
        center_id: undefined,
        household_id: undefined,
        search: "",
    },
    statusSummary: null as IndividualState["statusSummary"],
};

export const useIndividualStore = create<IndividualState>((set, get) => ({
    ...initialState,

    setSearchQuery: (q: string) => {
        set(state => ({
            searchQuery: q,
            currentPage: 1,
            appliedFilters: {
                ...state.appliedFilters,
                search: q
            }
        }));
    },

    setCurrentPage: (p: number) => set({ currentPage: p }),

    setEntriesPerPage: (n: number) => set({ entriesPerPage: n, currentPage: 1 }),

    setFilter: (filter: keyof IndividualState['appliedFilters'], value: any) => {
        set(state => ({
            appliedFilters: {
                ...state.appliedFilters,
                [filter]: value === 'all' || value === '' ? undefined : value
            },
            currentPage: 1
        }));
    },

    clearFilters: () => {
        set({
            appliedFilters: initialState.appliedFilters,
            currentPage: 1
        });
    },

    fetchIndividuals: async (params: IndividualFilterParams = {}) => {
        set({ loading: true, error: null });
        
        const currentFilters = get().appliedFilters;
        const page = params.page ?? get().currentPage;
        const limit = params.limit ?? get().entriesPerPage;
        
        const search = params.search ?? currentFilters.search ?? get().searchQuery;

        try {
            const response: IndividualsResponse = await IndividualService.getIndividuals({
                search,
                page,
                limit,
                sortBy: params.sortBy,
                sortOrder: params.sortOrder,
                household_id: params.household_id ?? currentFilters.household_id,
                status: params.status ?? currentFilters.status as any,
                gender: params.gender ?? currentFilters.gender as any,
                age_group: params.age_group ?? currentFilters.age_group as any,
                center_id: params.center_id ?? currentFilters.center_id,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            const individualsData = response.data?.results || [];
            const paginationData = response.data?.pagination;
            const filterMeta = response.data?.filters;

            set({
                individuals: individualsData,
                paginatedIndividuals: individualsData,
                totalRecords: paginationData?.total_items || 0,
                pagination: paginationData,
                appliedFilters: filterMeta?.applied_filters || initialState.appliedFilters,
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

    searchIndividuals: async (params: IndividualFilterParams = {}) => {
        set({ loading: true, error: null });
        try {
            const response: IndividualsResponse = await IndividualService.getIndividuals({
                search: params.search || "",
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: params.sortBy,
                sortOrder: params.sortOrder,
                household_id: params.household_id,
                status: params.status,
                gender: params.gender,
                age_group: params.age_group,
                center_id: params.center_id,
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            const individualsData = response.data?.results || [];
            const paginationData = response.data?.pagination;
            const filterMeta = response.data?.filters;
            
            set({
                paginatedIndividuals: individualsData,
                totalRecords: paginationData?.total_items || individualsData.length,
                currentPage: paginationData?.current_page || 1,
                searchQuery: params.search || "",
                pagination: paginationData,
                appliedFilters: filterMeta?.applied_filters || initialState.appliedFilters,
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
        set(state => ({
            paginatedIndividuals: [],  
            searchQuery: "",           
            currentPage: 1,            
            totalRecords: 0,           
            appliedFilters: {
                ...state.appliedFilters, 
                search: "",               
            },
            error: null,
        }));
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

    fetchIndividualById: async (id: number): Promise<Individual | null> => {
        set({ loading: true, error: null });
        try {
            const response: IndividualResponse = await IndividualService.getIndividualById(id);
            if (!response.success || !response.data) {
                throw new Error(response.message || "Failed to fetch individual");
            }
            const individual = response.data;
            set({ loading: false });
            return individual;
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to fetch individual",
                loading: false,
            });
            return null;
        }
    },

    fetchStatusSummary: async (params?: { center_id?: number; event_id?: number }) => {
        set({ loading: true, error: null });
        try {
            const response: StatusSummaryResponse = await IndividualService.getStatusSummary(params);
            if (!response.success) {
                throw new Error(response.message);
            }
            set({
                statusSummary: response.data,
                loading: false,
            });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to fetch status summary",
                loading: false,
                statusSummary: null,
            });
        }
    },

    searchIndividualsByName: async (name: string, limit: number = 10): Promise<Individual[]> => {
        set({ loading: true, error: null });
        try {
            const response = await IndividualService.searchIndividuals(name, limit);
            if (!response.success) {
                throw new Error(response.message);
            }
            set({ loading: false });
            return response.data || [];
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to search individuals by name",
                loading: false,
            });
            return [];
        }
    },

    recalculateStatuses: async () => {
        set({ loading: true, error: null });
        try {
            const response = await IndividualService.recalculateStatuses();
            if (!response.success) {
                throw new Error(response.message);
            }
            set({ loading: false });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : "Failed to recalculate statuses",
                loading: false,
            });
        }
    },

    resetState: () => set(initialState),
}));