import { useEffect } from "react";
import { AppSidebar } from "@/components/common/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Topbar from "@/components/common/Topbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !user) {
            navigate("/login");
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Redirecting to login...</div>
            </div>
        );
    }

    const getRoleLabel = () => {
        switch (user.role) {
            case "super_admin":
                return "Super Admin";
            case "city_admin":
                return "City Admin";
            case "center_admin":
                return "Center Administrator";
            case "volunteer":
                return "Volunteer";
            default:
                return "User";
        }
    };

    const roleLabel = getRoleLabel();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar role={user.role} roleLabel={roleLabel} userEmail={user.email} />

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="flex border-b border-border">
                        <SidebarTrigger className="h-14 w-14 flex items-center justify-center shrink-0" />
                        <div className="flex-1">
                            <Topbar title={roleLabel} />
                        </div>
                    </div>

                    <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
