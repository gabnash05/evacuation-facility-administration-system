// components/auth/ProtectedRoute.tsx
import type { UserRole } from '@/types/user';
import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    // const { isAuthenticated, user, isLoading } = useAuth();
    
    // Mock authentication state - replace with real useAuth
    const isAuthenticated = true; // Change to false to test protection
    const user = { role: "city_admin" as UserRole };
    const isLoading = false;

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && !requiredRole.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}