import { api, handleApiError } from "./api";
import type { User } from "@/types/user";
import type { LoginFormData, RegisterFormData } from "@/schemas/auth";
import type { LoginResponse, AuthResponse, UserResponse } from "@/types/user";

export class AuthService {
    static async login(credentials: LoginFormData): Promise<AuthResponse> {
        try {
            const response = await api.post<LoginResponse>("/auth/login", credentials, {
                withCredentials: true,
            });

            const token = response.data.data?.token;
            if (token) {
                // Set the token in the api instance headers
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            }

            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async register(userData: RegisterFormData): Promise<User> {
        try {
            const response = await api.post<UserResponse>("/auth/register", userData, {
                withCredentials: true,
            });
            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCurrentUser(): Promise<User> {
        try {
            const response = await api.get<UserResponse>("/auth/me", {
                withCredentials: true,
            });
            return response.data.data!;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async logout(): Promise<void> {
        try {
            await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (error) {
            console.error("Error logging out:", error);
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
