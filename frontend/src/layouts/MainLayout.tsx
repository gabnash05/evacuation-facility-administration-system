import { AppSidebar } from "@/components/common/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Topbar from "@/components/common/Topbar";
import type { UserRole } from "@/types/user";
// import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    // const { user, isLoading, isCityAdmin, isCenterAdmin, isVolunteer } = useAuth();
    
    // Mock data - replace with actual useAuth hook
    const user = {
        email: "nasayaokim@gmail.com",
        role: "city_admin" as UserRole,
    };
    const isLoading = false;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    const getRoleLabel = () => {
        switch (user.role) {
            case "city_admin":
            case "super_admin":
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
            <div className="flex min-h-screen bg-background">
                <AppSidebar role={user.role} roleLabel={roleLabel} userEmail={user.email}/>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex border-b border-border">
                        <SidebarTrigger className="h-14 w-14 flex items-center justify-center shrink-0" />
                        <div className="flex-1">
                            <Topbar title={roleLabel} />
                        </div>
                    </div>
                    
                    {/* 100vw - 21vw is from testing on my own device. Needs to be tested */}
                    <main className="flex-1 p-6 w-[calc(100vw-21vw)] overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
