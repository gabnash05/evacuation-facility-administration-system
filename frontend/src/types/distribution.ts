export interface Allocation {
    allocation_id: number;
    resource_name: string;
    total_quantity: number;
    remaining_quantity: number;
    category_name: string;
    center_id?: number;
    status: 'active' | 'depleted' | 'cancelled';
}

export interface HouseholdOption {
    household_id: number;
    household_name: string;
    member_count: number;
    family_head: string;
    center_id?: number;
}

export interface DistributionRecord {
    distribution_id: number;
    distribution_date: string;
    center_id: number;
    
    household_id: number;
    allocation_id: number; 

    household_name: string;
    category_name: string;
    resource_name: string; 
    quantity: number;
    volunteer_name: string;
    formatted_items: string; 

    // NEW STATUS FIELD
    status: 'completed' | 'voided';
}