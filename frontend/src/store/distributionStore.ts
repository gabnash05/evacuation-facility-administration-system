import { create } from "zustand";
import type { Allocation, HouseholdOption, DistributionRecord } from "@/types/distribution";
import { HouseholdService } from "@/services/householdService";
import { DistributionService } from "@/services/distributionService"; // Import the new service

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
        try {
            const { searchQuery, currentPage, entriesPerPage } = get();

            // 1. Fetch Real Households
            const householdResponse = await HouseholdService.getHouseholds({ limit: 100 });
            const rawHouseholds = householdResponse.data?.results || [];
            
            const realHouseholds: HouseholdOption[] = rawHouseholds.map((h: any) => ({
                household_id: h.household_id,
                household_name: h.household_name,
                member_count: h.member_count ?? (h.individuals?.length || 0),
                family_head: h.household_head 
                    ? `${h.household_head.first_name} ${h.household_head.last_name}` 
                    : "No Head Assigned"
            }));

            // 2. Fetch Real Distribution History
            const historyResponse = await DistributionService.getHistory({
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage
            });

            // 3. Fetch Allocations (Inventory)
            // If your groupmate hasn't finished the endpoint, this might return empty.
            // You might need to temporarily keep MOCK_ALLOCATIONS here if the API 404s.
            const allocationResponse = await DistributionService.getAllocations();
            
            // NOTE: If allocationResponse.data is empty/undefined, the dropdown will be empty.
            // If you ran the SQL above, you should see data here assuming the endpoint exists.
            
            set({
                households: realHouseholds,
                history: historyResponse.data || [], 
                allocations: allocationResponse.data || [], 
                isLoading: false
            });

        } catch (error) {
            console.error("Failed to fetch data:", error);
            set({ isLoading: false });
        }
    },

    submitDistribution: async (householdId, items) => {
        set({ isLoading: true });
        try {
            // Map store format to API payload format
            const payload = {
                household_id: householdId,
                items: items.map(i => ({
                    allocation_id: i.allocationId,
                    quantity: i.quantity
                }))
            };

            await DistributionService.create(payload);
            
            // Refresh data to show new record and updated stock
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
            // Remove locally to update UI immediately
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

    // Note: Update Logic requires a backend endpoint we haven't built yet (PUT).
    // For now, we can leave this as a mock or implement the PUT endpoint.
    updateDistribution: async (id, quantity) => {
        console.warn("Update feature not fully connected to backend yet.");
        set({ isLoading: false });
    }
}));