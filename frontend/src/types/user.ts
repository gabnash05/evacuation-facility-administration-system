import type { ApiResponse, PaginatedResponse, SearchParams } from "./api";

export type UserRole = "super_admin" | "city_admin" | "center_admin" | "volunteer";

export interface User {
    user_id: number;
    email: string;
    role: UserRole;
    center_id?: number | null;
    center_name?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AuthResponse {
    role: UserRole;
    token?: string;
}

export interface GetUsersParams extends SearchParams {
    role?: UserRole;
    isActive?: boolean;
}

// API Response types
export type LoginResponse = ApiResponse<AuthResponse>;
export type UserResponse = ApiResponse<User>;
export type UsersResponse = PaginatedResponse<User>;
