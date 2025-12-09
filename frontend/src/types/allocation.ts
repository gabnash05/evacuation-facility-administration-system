export interface AidCategory {
    category_id: number;
    category_name: string; // e.g., "Food", "Water"
}

export interface Allocation {
    allocation_id: number;
    category_id: number;
    category_name: string; // Mapped for display
    center_id: number;
    center_name: string;   // Mapped for display
    resource_name: string; // e.g., "Family Food Pack A"
    description?: string;
    total_quantity: number;
    remaining_quantity: number;
    distribution_type: 'per_household' | 'per_individual';
    status: 'active' | 'depleted' | 'cancelled';
    event_id: number; // For now we'll mock this or set default
}

export interface CreateAllocationForm {
    center_id: string;
    category_id: string;
    resource_name: string;
    total_quantity: number;
    distribution_type: 'per_household' | 'per_individual';
    description?: string;
}