import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/user";

export function useAuth() {
    const { 
        checkAuth, 
        isLoading, 
        isAuthenticated, 
        user, 
        hasRole, 
        clearAuth,
        login,
        logout
    } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    const performAuthCheck = useCallback(async () => {
        if (isLoading) return;

        setError(null);
        try {
            await checkAuth();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication check failed");
            clearAuth();
        }
    }, [checkAuth, clearAuth]);

    // Retry function for manual retry
    const retryAuthCheck = useCallback(() => {
        setError(null);
        performAuthCheck();
    }, [performAuthCheck]);

    const requireRole = useCallback(
        (roles: UserRole[]) => {
            return hasRole(roles);
        },
        [hasRole]
    );

    const canAccessCenter = useCallback(
        (centerId: number) => {
            if (!user) return false;

            if (user.role === "city_admin" || user.role === "super_admin") {
                return true;
            }

            return user.centerId === centerId;
        },
        [user]
    );

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        error,

        // Actions
        login,
        logout,
        checkAuth: performAuthCheck,
        retryAuthCheck,

        // Helpers
        requireRole,
        canAccessCenter,

        // Role-specific booleans
        isCityAdmin: user?.role === "city_admin" || user?.role === "super_admin",
        isCenterAdmin: user?.role === "center_admin",
        isVolunteer: user?.role === "volunteer",
    };
}
