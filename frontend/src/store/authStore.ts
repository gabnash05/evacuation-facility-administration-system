import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types/user";
import { AuthService } from "@/services/authService";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: { role: string }) => void;
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

            login: (userData: { role: string }) => {
                const user: User = {
                    id: 0, // Will be populated by getCurrentUser later
                    email: "", // Will be populated by getCurrentUser later
                    role: userData.role as UserRole,
                    isActive: true,
                };
                set({ user, isAuthenticated: true });
            },

            logout: async () => {
                await AuthService.logout();
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
