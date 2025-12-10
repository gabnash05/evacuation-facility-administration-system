import { create } from "zustand";
import type { Allocation, HouseholdOption, DistributionRecord } from "@/types/distribution";
import { HouseholdService } from "@/services/householdService";
import { DistributionService } from "@/services/distributionService";
import { useAuthStore } from "./authStore";

interface DistributionState {
    allocations: Allocation[];
    households: HouseholdOption[];
    history: DistributionRecord[];
    isLoading: boolean;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    
    // Actions
    fetchData: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (limit: number) => void;
    
    submitDistribution: (
        householdId: number, 
        items: { allocationId: number; quantity: number }[]
    ) => Promise<void>;

    deleteDistribution: (id: number) => Promise<void>;
    updateDistribution: (id: number, quantity: number) => Promise<void>;
}

export const useDistributionStore = create<DistributionState>((set, get) => ({
    allocations: [],
    households: [], 
    history: [],
    isLoading: false,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,

    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setEntriesPerPage: (limit) => set({ entriesPerPage: limit, currentPage: 1 }),

    fetchData: async () => {
        set({ isLoading: true });
        
        const { user } = useAuthStore.getState();

        let realHouseholds: HouseholdOption[] = [];
        let realHistory: DistributionRecord[] = [];
        let realAllocations: Allocation[] = [];

        try {
            // 1. Fetch Real Households
            try {
                // FIX: Convert null to undefined
                const centerId = user?.center_id ?? undefined;
                const householdResponse = await HouseholdService.getHouseholds({ limit: 100, centerId: centerId });
                const rawHouseholds = householdResponse.data?.results || [];
                
                realHouseholds = rawHouseholds.map((h: any) => ({
                    household_id: h.household_id,
                    household_name: h.household_name,
                    member_count: h.member_count ?? (h.individuals?.length || 0),
                    family_head: h.household_head 
                        ? `${h.household_head.first_name} ${h.household_head.last_name}` 
                        : "No Head Assigned"
                }));
            } catch (err) {
                console.error("Error fetching households:", err);
            }

            // 2. Fetch Distribution History
            try {
                const { searchQuery, currentPage, entriesPerPage } = get();
                const historyResponse = await DistributionService.getHistory({
                    search: searchQuery,
                    page: currentPage,
                    limit: entriesPerPage
                });
                realHistory = historyResponse.data || [];
            } catch (err) {
                console.error("Error fetching history:", err);
            }

            // 3. Fetch Allocations (Real Inventory)
            try {
                // FIX: Convert null to undefined
                const centerId = user?.center_id ?? undefined;
                const allocationResponse = await DistributionService.getAllocations(centerId);
                
                if (allocationResponse.data && Array.isArray(allocationResponse.data.results)) {
                    realAllocations = allocationResponse.data.results;
                } else if (Array.isArray(allocationResponse.data)) {
                    realAllocations = allocationResponse.data;
                }
            } catch (err) {
                console.error("Error fetching allocations:", err);
            }

            set({
                households: realHouseholds,
                history: realHistory,
                allocations: realAllocations,
                isLoading: false
            });

        } catch (error) {
            console.error("Critical error in fetchData:", error);
            set({ isLoading: false });
        }
    },

    submitDistribution: async (householdId, items) => {
        set({ isLoading: true });
        try {
            const payload = {
                household_id: householdId,
                items: items.map(i => ({
                    allocation_id: i.allocationId,
                    quantity: i.quantity
                }))
            };

            await DistributionService.create(payload);
            await get().fetchData(); 
            
        } catch (error) {
            console.error("Distribution failed:", error);
            alert(error instanceof Error ? error.message : "Failed to record distribution");
            set({ isLoading: false });
        }
    },

    deleteDistribution: async (id) => {
        set({ isLoading: true });
        try {
            await DistributionService.delete(id);
            const { history } = get();
            set({
                history: history.filter(h => h.distribution_id !== id),
                isLoading: false
            });
        } catch (error) {
            console.error("Delete failed:", error);
            set({ isLoading: false });
        }
    },

    updateDistribution: async (id, quantity) => {
        console.warn(`Update feature not connected to backend. Attempted to update ID: ${id} with Quantity: ${quantity}`);
        set({ isLoading: false });
    }
}));