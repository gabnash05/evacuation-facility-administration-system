export interface Allocation {
    allocation_id: number;
    resource_name: string;
    total_quantity: number;
    remaining_quantity: number;
    category_name: string;
    status: 'active' | 'depleted' | 'cancelled';
}

export interface HouseholdOption {
    household_id: number;
    household_name: string;
    member_count: number;
    family_head: string;
}

export interface DistributionRecord {
    distribution_id: number;
    distribution_date: string;
    
    // IDs are needed for Editing
    household_id: number;
    allocation_id: number; 

    // Display names
    household_name: string;
    resource_name: string; 
    quantity: number;
    volunteer_name: string;
    formatted_items: string; 
}