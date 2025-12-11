// Updated authStore.ts with resetState method
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, User, UserRole } from "@/types/user";
import type { LoginFormData } from "@/schemas";
import { AuthService } from "@/services/authService";
import { useAttendanceStore } from "./attendanceRecordsStore";
import { useIndividualStore } from "./individualStore";
import { useEvacuationCenterStore } from "./evacuationCenterStore";
import { useUserStore } from "./userStore";
import { useEventStore } from "./eventStore";
import { useHouseholdStore } from "./householdStore";
import { useAidAllocationStore } from "./aidAllocationStore";
import { useDistributionStore } from "./distributionStore";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginFormData) => Promise<AuthResponse>;
    logout: () => void;
    isLoggingOut: boolean;
    setUser: (user: User) => void;
    hasRole: (roles: UserRole[]) => boolean;
    checkAuth: () => Promise<boolean>;
    clearAuth: () => void;
    resetState: () => void; // Add this
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isLoggingOut: false,

            login: async (credentials: LoginFormData): Promise<AuthResponse> => {
                set({ isLoading: true });
                try {
                    // 1. Call login service
                    const response = await AuthService.login(credentials);

                    // 2. Get user data after successful login
                    const user = await AuthService.getCurrentUser();

                    // 3. Update store state
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return response;
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoggingOut: true });
                try {
                    await AuthService.logout();
                    
                    // Reset all stores
                    const attendanceStore = useAttendanceStore.getState();
                    const individualStore = useIndividualStore.getState();
                    const evacuationCenterStore = useEvacuationCenterStore.getState();
                    const userStore = useUserStore.getState();
                    const eventStore = useEventStore.getState();
                    const householdStore = useHouseholdStore.getState();
                    const aidAllocationStore = useAidAllocationStore.getState();
                    const distributionStore = useDistributionStore.getState();
                    
                    if (attendanceStore.resetState) attendanceStore.resetState();
                    if (individualStore.resetState) individualStore.resetState();
                    if (evacuationCenterStore.resetState) evacuationCenterStore.resetState();
                    if (userStore.resetState) userStore.resetState();
                    if (eventStore.resetState) eventStore.resetState();
                    if (householdStore.resetState) householdStore.resetState();
                    if (aidAllocationStore.resetState) aidAllocationStore.resetState();
                    if (distributionStore.resetState) distributionStore.resetState();
                    
                    // Clear auth store
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoggingOut: false,
                    });
                } catch (error) {
                    console.error("Logout error:", error);
                    const attendanceStore = useAttendanceStore.getState();
                    const individualStore = useIndividualStore.getState();
                    const evacuationCenterStore = useEvacuationCenterStore.getState();
                    const userStore = useUserStore.getState();
                    const eventStore = useEventStore.getState();
                    const householdStore = useHouseholdStore.getState();
                    const aidAllocationStore = useAidAllocationStore.getState();
                    const distributionStore = useDistributionStore.getState();
                    
                    if (attendanceStore.resetState) attendanceStore.resetState();
                    if (individualStore.resetState) individualStore.resetState();
                    if (evacuationCenterStore.resetState) evacuationCenterStore.resetState();
                    if (userStore.resetState) userStore.resetState();
                    if (eventStore.resetState) eventStore.resetState();
                    if (householdStore.resetState) householdStore.resetState();
                    if (aidAllocationStore.resetState) aidAllocationStore.resetState();
                    if (distributionStore.resetState) distributionStore.resetState();
                    
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoggingOut: false,
                    });
                    throw error;
                }
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

            resetState: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isLoggingOut: false,
                });
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