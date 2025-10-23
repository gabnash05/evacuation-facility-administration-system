import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types/user";
import type { LoginFormData } from "@/schemas";
import { AuthService } from "@/services/authService";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginFormData) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    hasRole: (roles: UserRole[]) => boolean;
    checkAuth: () => Promise<boolean>;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (credentials: LoginFormData): Promise<void> => {
                set({ isLoading: true });
                try {
                    // 1. Call login service
                    await AuthService.login(credentials);
                    
                    // 2. Get user data after successful login
                    const user = await AuthService.getCurrentUser();
                    
                    // 3. Update store state
                    set({ 
                        user, 
                        isAuthenticated: true, 
                        isLoading: false 
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                await AuthService.logout();
                set({ user: null, isAuthenticated: false });
            },

            setUser: (user: User) => set({ user, isAuthenticated: true }),

            hasRole: (roles: UserRole[]) => {
                const { user } = get();
                return user ? roles.includes(user.role) : false;
            },

            checkAuth: async (): Promise<boolean> => {
                set({ isLoading: true });
                try {
                    const user = await AuthService.getCurrentUser();
                    set({ user, isAuthenticated: true, isLoading: false });
                    return true;
                } catch (error) {
                    console.error("Auth check failed:", error);
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    return false;
                }
            },

            clearAuth: () => {
                set({ user: null, isAuthenticated: false });
            },
        }),
        {
            name: "auth-storage",
            partialize: state => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
