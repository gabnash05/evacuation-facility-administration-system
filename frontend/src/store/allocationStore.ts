import { create } from "zustand";
import type { Allocation, AidCategory } from "@/types/allocation";

interface AllocationState {
    allocations: Allocation[];
    categories: AidCategory[];
    isLoading: boolean;
    searchQuery: string;
    
    // We ONLY need fetch/search for the Volunteer Dropdown
    fetchData: () => Promise<void>;
    setSearchQuery: (query: string) => void;
}

// Keep the mock data so your dropdowns have something to show
const MOCK_CATEGORIES: AidCategory[] = [
    { category_id: 1, category_name: "Food" },
    { category_id: 2, category_name: "Water" },
    { category_id: 3, category_name: "Medical" },
    { category_id: 4, category_name: "Hygiene" },
    { category_id: 5, category_name: "Clothing" },
    { category_id: 6, category_name: "Shelter" },
];

const MOCK_ALLOCATIONS: Allocation[] = [
    { 
        allocation_id: 101, 
        category_id: 1, 
        category_name: "Food",
        center_id: 1, 
        center_name: "Northside High School",
        resource_name: "Family Food Pack (Standard)",
        total_quantity: 500,
        remaining_quantity: 450,
        distribution_type: "per_household",
        status: "active",
        event_id: 1
    },
    { 
        allocation_id: 102, 
        category_id: 2, 
        category_name: "Water",
        center_id: 2, 
        center_name: "City Gym",
        resource_name: "Bottled Water 500ml",
        total_quantity: 1000,
        remaining_quantity: 1000,
        distribution_type: "per_individual",
        status: "active",
        event_id: 1
    }
];

export const useAllocationStore = create<AllocationState>((set) => ({
    allocations: [],
    categories: [],
    isLoading: false,
    searchQuery: "",

    setSearchQuery: (query) => set({ searchQuery: query }),

    fetchData: async () => {
        set({ isLoading: true });
        setTimeout(() => {
            set({
                allocations: MOCK_ALLOCATIONS,
                categories: MOCK_CATEGORIES,
                isLoading: false
            });
        }, 600);
    },
}));