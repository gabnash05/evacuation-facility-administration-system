import type { ApiResponse, PaginatedResponse } from "./api";

export type UserRole = "super_admin" | "city_admin" | "center_admin" | "volunteer";

export interface User {
    id: number;
    email: string;
    role: UserRole;
    centerId?: number | null;
    isActive: boolean;
    createdAt?: string;
}

export interface AuthResponse {
    role: UserRole;
}

// API Response types
export interface LoginResponse extends ApiResponse<AuthResponse> {}
export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends PaginatedResponse<User> {}
