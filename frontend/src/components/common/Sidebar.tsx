import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { 
    LayoutDashboard,
    Building,
    Calendar,
    Users,
    LogOut,
} from "lucide-react";
import efasLogo from '@/assets/logo/efas-logo.png';
import { ModeToggle } from "./ModeToggle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
}

interface AppSidebarProps {
    role: string;
    roleLabel: string;
    userEmail?: string;
}

export function AppSidebar({ role, roleLabel, userEmail }: AppSidebarProps) {
    const { logout, isLoggingOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const getNavigationItems = (): SidebarItem[] => {
        switch (role) {
            case "city_admin":
            case "super_admin":
                return [
                    { key: "dashboard", label: "Dashboard", href: "/city-admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                    { key: "centers", label: "Evacuation Centers", href: "/city-admin/centers", icon: <Building className="w-4 h-4" /> },
                    { key: "events", label: "Events", href: "/city-admin/events", icon: <Calendar className="w-4 h-4" /> },
                    { key: "households", label: "Households", href: "/city-admin/households", icon: <Users className="w-4 h-4" /> },
                ];
            case "center_admin":
                return [
                    { key: "dashboard", label: "Dashboard", href: "/center-admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                    { key: "households", label: "Households", href: "/center-admin/households", icon: <Users className="w-4 h-4" /> },
                ];
            case "volunteer":
                return [
                    { key: "dashboard", label: "Dashboard", href: "/volunteer/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                ];
            default:
                return [
                    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                ];
        }
    };

    const navigationItems = getNavigationItems();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm">
            <SidebarHeader className="border-sidebar-border">
                <div className="p-1 flex items-center gap-2">
                    <img
                        src={efasLogo}
                        alt="EFAS Logo" 
                        className="w-15 h-15 object-contain"
                    />
                    <h2 className="text-lg font-semibold tracking-tight">EFAS</h2>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <nav className="space-y-1 p-2">
                        {navigationItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.key}
                                    to={item.href || `/${item.key}`}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        "text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                                        !isActive && "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <div className="p-2 space-y-1">
                    {/* Theme Toggle */}
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "cursor-pointer"
                    )}>
                        <ModeToggle>
                            <span className="flex-1 text-left">Theme</span>
                        </ModeToggle>
                    </div>
                    
                    {/* Logout Button */}
                     <button
                        onClick={handleLogout}
                        disabled={isLoggingOut} // Disable during logout
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                            "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                </div>
                
                {/* User Info */}
                <div className="p-4 space-y-1 border-t border-sidebar-border">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Logged in as {roleLabel}
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}