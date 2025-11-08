export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        results: T[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            limit: number;
        };
    };
}

export interface SearchParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface SortConfig {
    key: string;
    direction: "asc" | "desc" | null;
}
