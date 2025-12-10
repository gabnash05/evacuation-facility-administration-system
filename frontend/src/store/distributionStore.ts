// distributionStore.ts - Fixed version
import { create } from "zustand";
import type { Allocation, HouseholdOption, DistributionRecord } from "@/types/distribution";
import { HouseholdService } from "@/services/householdService";
import { DistributionService } from "@/services/distributionService";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import { useAuthStore } from "./authStore";
import type { EvacuationCenter } from "@/types/center";

// Type for the update payload
interface DistributionUpdatePayload {
    household_id: number;
    allocation_id: number;
    quantity: number;
    center_id?: number;
}

interface DistributionState {
    allocations: Allocation[];
    households: HouseholdOption[];
    centers: EvacuationCenter[];
    history: DistributionRecord[];
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    selectedCenterId: number | null;
    sortColumn: string;
    sortDirection: "asc" | "desc";
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;
    
    // Actions
    fetchData: () => Promise<void>;
    fetchCenters: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (limit: number) => void;
    setSelectedCenterId: (centerId: number | null) => void;
    setSortColumn: (column: string) => void;
    setSortDirection: (direction: "asc" | "desc") => void;
    clearError: () => void;
    
    submitDistribution: (
        householdId: number, 
        centerId: number,
        items: { allocationId: number; quantity: number }[]
    ) => Promise<{ success: boolean; error?: string }>;

    deleteDistribution: (id: number) => Promise<{ success: boolean; error?: string }>;
    updateDistribution: (id: number, updates: DistributionUpdatePayload) => Promise<{ success: boolean; error?: string }>;
    
    // Helper to get center-specific allocations
    getCenterAllocations: (centerId: number) => Allocation[];
    
    // Reset
    resetState: () => void;
}

const initialState = {
    allocations: [] as Allocation[],
    households: [] as HouseholdOption[], 
    centers: [] as EvacuationCenter[],
    history: [] as DistributionRecord[],
    isLoading: false,
    error: null as string | null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    selectedCenterId: null as number | null,
    sortColumn: "distribution_date",
    sortDirection: "desc" as "asc" | "desc",
    pagination: null,
};

export const useDistributionStore = create<DistributionState>((set, get) => ({
    ...initialState,

    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1, error: null }),
    setCurrentPage: (page) => set({ currentPage: page, error: null }),
    setEntriesPerPage: (limit) => set({ entriesPerPage: limit, currentPage: 1, error: null }),
    setSelectedCenterId: (centerId) => set({ selectedCenterId: centerId, error: null }),
    setSortColumn: (column) => set({ sortColumn: column, currentPage: 1, error: null }),
    setSortDirection: (direction) => set({ sortDirection: direction, currentPage: 1, error: null }),
    clearError: () => set({ error: null }),

    fetchData: async () => {
        set({ isLoading: true, error: null });
        
        const { user } = useAuthStore.getState();
        const { selectedCenterId, searchQuery, currentPage, entriesPerPage, sortColumn, sortDirection } = get();

        let realHouseholds: HouseholdOption[] = [];
        let realHistory: DistributionRecord[] = [];
        let realAllocations: Allocation[] = [];
        let paginationData = null;

        try {
            // Fetch centers first
            await get().fetchCenters();
            
            // Get user's center context
            let userCenterId = user?.center_id ?? undefined;
            
            // If user is center-specific and no center selected yet, auto-select their center
            if (user?.center_id && !selectedCenterId) {
                set({ selectedCenterId: user.center_id });
                userCenterId = user.center_id;
            }

            // Households - filter by center if selected
            try {
                const centerIdForHouseholds = selectedCenterId || userCenterId;
                const householdResponse = await HouseholdService.getHouseholds({ 
                    limit: 100, 
                    centerId: centerIdForHouseholds 
                });
                realHouseholds = householdResponse.data?.results?.map((h: any) => ({
                    household_id: h.household_id,
                    household_name: h.household_name,
                    member_count: h.member_count ?? (h.individuals?.length || 0),
                    family_head: h.household_head ? `${h.household_head.first_name} ${h.household_head.last_name}` : "No Head",
                    center_id: h.center_id || centerIdForHouseholds
                })) || [];
            } catch (err) { 
                console.error("Failed to fetch households:", err);
                set({ error: "Failed to load households. Please try again." });
            }

            // History - Server-side pagination
            try {
                const historyResponse = await DistributionService.getHistory({
                    search: searchQuery, 
                    page: currentPage, 
                    limit: entriesPerPage,
                    // Only pass center_id if user is NOT city admin/super admin
                    center_id: (user?.role === 'city_admin' || user?.role === 'super_admin') 
                        ? undefined  // City/Super admins see all records by default
                        : selectedCenterId || userCenterId,
                    sort_by: sortColumn || "distribution_date",
                    sort_order: sortDirection || "desc",
                });
                
                // IMPORTANT: Assuming your API response has this structure
                realHistory = historyResponse.data?.results || historyResponse.data || [];
                paginationData = historyResponse.data?.pagination || {
                    current_page: currentPage,
                    total_pages: Math.ceil((historyResponse.data?.total || 0) / entriesPerPage),
                    total_items: historyResponse.data?.total || 0,
                    limit: entriesPerPage
                };
                
            } catch (err) { 
                console.error("Failed to fetch history:", err);
                set({ error: "Failed to load distribution history. Please try again." });
            }

            // Allocations - fetch all, filtering will be done in components
            try {
                const allocationResponse = await DistributionService.getAllocations();
                realAllocations = allocationResponse.data?.results || 
                                (Array.isArray(allocationResponse.data) ? allocationResponse.data : []);
            } catch (err) { 
                console.error("Failed to fetch allocations:", err);
                set({ error: "Failed to load aid allocations. Please try again." });
            }
            
            set({
                households: realHouseholds,
                history: realHistory,
                allocations: realAllocations,
                pagination: paginationData, // Store pagination data
                isLoading: false
            });

        } catch (error) {
            console.error("Critical error in fetchData:", error);
            set({ 
                isLoading: false, 
                error: error instanceof Error ? error.message : "Failed to load data. Please try again." 
            });
        }
    },

    fetchCenters: async () => {
        const { user } = useAuthStore.getState();
        
        try {
            // If user is center admin or volunteer, only fetch their center
            if (user?.center_id && (user.role === 'center_admin' || user.role === 'volunteer')) {
                const centerResponse = await EvacuationCenterService.getCenterById(user.center_id);
                if (centerResponse.success && centerResponse.data) {
                    set({ centers: [centerResponse.data], error: null });
                } else {
                    set({ centers: [], error: centerResponse.message || "Failed to load your center" });
                }
            } else {
                // For city admin/super admin, fetch all centers
                const centersResponse = await EvacuationCenterService.getCenters({ limit: 100 });
                set({ centers: centersResponse.data?.results || [], error: null });
            }
        } catch (error) {
            console.error("Failed to fetch centers:", error);
            set({ 
                centers: [], 
                error: error instanceof Error ? error.message : "Failed to load evacuation centers. Please try again." 
            });
        }
    },

    submitDistribution: async (householdId, centerId, items) => {
        set({ isLoading: true, error: null });
        try {
            const payload = {
                household_id: householdId,
                center_id: centerId,
                items: items.map(i => ({
                    allocation_id: i.allocationId,
                    quantity: i.quantity
                }))
            };
            
            const response = await DistributionService.create(payload);
            
            if (!response.success) {
                throw new Error(response.message || "Failed to record distribution");
            }
            
            await get().fetchData();
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to record distribution";
            console.error("Distribution failed:", error);
            set({ 
                isLoading: false, 
                error: errorMessage 
            });
            return { success: false, error: errorMessage };
        }
    },

    deleteDistribution: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await DistributionService.delete(id);
            
            if (!response.success) {
                throw new Error(response.message || "Failed to delete distribution");
            }
            
            const { history } = get();
            set({
                history: history.filter(h => h.distribution_id !== id),
                isLoading: false
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete distribution";
            console.error("Delete failed:", error);
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    updateDistribution: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await DistributionService.update(id, updates);
            
            if (!response.success) {
                throw new Error(response.message || "Failed to update distribution");
            }
            
            await get().fetchData();
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update distribution";
            console.error("Update failed:", error);
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    getCenterAllocations: (centerId) => {
        const { allocations } = get();
        return allocations.filter(alloc => alloc.center_id === centerId);
    },
    
    resetState: () => set(initialState),
}));