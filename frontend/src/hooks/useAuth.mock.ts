import { useEffect, useCallback, useState } from "react";
import type { UserRole, User } from "@/types/user";

// Mock user data
const MOCK_USERS: Record<string, User> = {
    super_admin: {
        id: 1,
        email: "super@efas.gov",
        role: "super_admin",
        centerId: null,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z"
    },
    city_admin: {
        id: 2,
        email: "city@efas.gov", 
        role: "city_admin",
        centerId: null,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z"
    },
    center_admin: {
        id: 3,
        email: "center@efas.gov",
        role: "center_admin",
        centerId: 1,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z"
    },
    volunteer: {
        id: 4,
        email: "volunteer@efas.gov",
        role: "volunteer",
        centerId: 1,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z"
    }
};

// Change this to test different roles
const MOCK_ROLE: UserRole = "city_admin";

export function useAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user: User = MOCK_USERS[MOCK_ROLE];
    const isAuthenticated = true;

    const performAuthCheck = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsLoading(false);
    }, []);

    useEffect(() => {
        performAuthCheck();
    }, [performAuthCheck]);

    const retryAuthCheck = useCallback(() => {
        setError(null);
        performAuthCheck();
    }, [performAuthCheck]);

    const requireRole = useCallback(
        (roles: UserRole[]) => {
            return roles.includes(MOCK_ROLE);
        },
        []
    );

    const canAccessCenter = useCallback(
        (centerId: number) => {
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
        checkAuth: performAuthCheck,
        retryAuthCheck,

        // Helpers
        requireRole,
        canAccessCenter,

        // Role-specific booleans
        isCityAdmin: user.role === "city_admin" || user.role === "super_admin",
        isCenterAdmin: user.role === "center_admin",
        isVolunteer: user.role === "volunteer",
    };
}