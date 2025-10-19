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
            currentPage: number;
            totalPages: number;
            totalItems: number;
            limit: number;
        };
    };
}

export interface SearchParams {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    center_id?: number;
    [key: string]: any;
}
