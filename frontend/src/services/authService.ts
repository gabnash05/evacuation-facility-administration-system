import { api, handleApiError } from "./api";
import type { User } from "@/types/user";
import type { LoginFormData, RegisterFormData } from "@/schemas/auth";
import type { LoginResponse, UserResponse } from "@/types/user";
import type { ApiResponse } from "@/types/api";

export class AuthService {
    static async login(credentials: LoginFormData): Promise<LoginResponse> {
        try {
            const response = await api.post<ApiResponse<LoginResponse>>(
                "/api/auth/login",
                credentials
            );

            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async register(userData: RegisterFormData): Promise<UserResponse> {
        try {
            const response = await api.post<ApiResponse<UserResponse>>(
                "/api/auth/register",
                userData
            );
            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCurrentUser(): Promise<User> {
        try {
            const response = await api.get<ApiResponse<User>>("/api/auth/me");
            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async logout(): Promise<void> {
        try {
            await api.post("/api/auth/logout");
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            window.location.assign("/login");
        }
    }

    static async checkAuthStatus(): Promise<boolean> {
        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            console.warn("User is not authenticated:", error);
            return false;
        }
    }
}
