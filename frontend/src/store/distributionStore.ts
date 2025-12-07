import { create } from "zustand";
import type { Allocation, HouseholdOption, DistributionRecord } from "@/types/distribution";
import { HouseholdService } from "@/services/householdService";

interface DistributionState {
    allocations: Allocation[];
    households: HouseholdOption[];
    history: DistributionRecord[];
    isLoading: boolean;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    
    fetchData: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (limit: number) => void;
    
    submitDistribution: (
        householdId: number, 
        items: { allocationId: number; quantity: number }[]
    ) => Promise<void>;
}

const MOCK_ALLOCATIONS: Allocation[] = [
    { allocation_id: 1, resource_name: "Family Food Packs", total_quantity: 500, remaining_quantity: 450, category_name: "Food", status: "active" },
    { allocation_id: 2, resource_name: "Bottled Water (500ml)", total_quantity: 1000, remaining_quantity: 800, category_name: "Water", status: "active" },
    { allocation_id: 3, resource_name: "Hygiene Kits", total_quantity: 200, remaining_quantity: 50, category_name: "Hygiene", status: "active" },
    { allocation_id: 4, resource_name: "Sleeping Mats", total_quantity: 150, remaining_quantity: 0, category_name: "Shelter", status: "depleted" },
];

const MOCK_HISTORY: DistributionRecord[] = [
    { 
        distribution_id: 1, 
        distribution_date: new Date().toISOString(), 
        household_name: "Sample Distribution Record", 
        resource_name: "Family Food Packs", 
        quantity: 1, 
        volunteer_name: "Volunteer One",
        formatted_items: "Family Food Packs (1)"
    }
];

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

            const response = await HouseholdService.getHouseholds({ limit: 100 });
            
            const rawHouseholds = response.data?.results || [];

            const realHouseholds: HouseholdOption[] = rawHouseholds.map((h: any) => ({
                household_id: h.household_id,
                household_name: h.household_name,
                
                member_count: h.member_count ?? (h.individuals?.length || 0),
                
                family_head: h.household_head 
                    ? `${h.household_head.first_name} ${h.household_head.last_name}` 
                    : "No Head Assigned"
            }));

            set({
                households: realHouseholds,
                allocations: MOCK_ALLOCATIONS,
                history: MOCK_HISTORY,
                isLoading: false
            });

        } catch (error) {
            console.error("Failed to fetch distribution data:", error);
            set({ 
                households: [], 
                allocations: MOCK_ALLOCATIONS, 
                history: MOCK_HISTORY,
                isLoading: false 
            });
        }
    },

    submitDistribution: async (householdId, items) => {
        set({ isLoading: true });
        
        setTimeout(() => {
            const { allocations, households, history } = get();
            const targetHousehold = households.find(h => h.household_id === householdId);
            
            if (!targetHousehold) return;

            const updatedAllocations = allocations.map(alloc => {
                const itemToDeduct = items.find(i => i.allocationId === alloc.allocation_id);
                if (itemToDeduct) {
                    const newRemaining = alloc.remaining_quantity - itemToDeduct.quantity;
                    return {
                        ...alloc,
                        remaining_quantity: newRemaining,
                        status: newRemaining === 0 ? "depleted" : alloc.status
                    } as Allocation;
                }
                return alloc;
            });

            const newLogs: DistributionRecord[] = items.map(item => {
                const allocDetails = allocations.find(a => a.allocation_id === item.allocationId);
                return {
                    distribution_id: Math.random(),
                    distribution_date: new Date().toISOString(),
                    household_name: targetHousehold.household_name,
                    resource_name: allocDetails?.resource_name || "Unknown",
                    quantity: item.quantity,
                    volunteer_name: "Current User", 
                    formatted_items: `${allocDetails?.resource_name} (${item.quantity})`
                };
            });

            set({
                allocations: updatedAllocations,
                history: [...newLogs, ...history], 
                isLoading: false
            });
        }, 1000);
    }
}));