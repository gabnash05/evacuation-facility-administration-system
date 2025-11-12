import { useEffect, useMemo, useState } from "react";
import { UserTable } from "@/components/features/user-management/UserTable";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { useUserStore } from "@/store/userStore";
import { debounce } from "@/utils/helpers";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

export function CenterAdminUserManagementPage() {
    const {
        users,
        loading,
        error,
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        pagination,
        setSearchQuery,
        setCurrentPage,
        setEntriesPerPage,
        setSortConfig,
        fetchUsers,
    } = useUserStore();

    // Get current user and role
    const { user } = useAuthStore();
    const userRole = user?.role;
    const userCenterId = user?.center_id; // Get the center_id from current user

    // Local state for role filter
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Create debounced fetch function that includes center_id
    const debouncedFetchUsers = useMemo(() => 
        debounce(() => fetchUsers(userCenterId), 500), 
        [fetchUsers, userCenterId]
    );

    // Fetch users when dependencies change - automatically filtered by user's center
    useEffect(() => {
        if (
            searchQuery ||
            entriesPerPage !== 10 ||
            roleFilter !== "all" ||
            statusFilter !== "all"
        ) {
            debouncedFetchUsers();
        } else {
            // Always fetch with the user's center_id
            fetchUsers(userCenterId);
        }
    }, [
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        roleFilter,
        statusFilter,
        fetchUsers,
        debouncedFetchUsers,
        userCenterId, // Add userCenterId to dependencies
    ]);

    // Reset filters and fetch when userCenterId changes
    useEffect(() => {
        if (userCenterId) {
            setCurrentPage(1);
            fetchUsers(userCenterId);
        }
    }, [userCenterId, fetchUsers, setCurrentPage]);

    const handleSort = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            setSortConfig({ key, direction: "asc" });
            return;
        }

        switch (sortConfig.direction) {
            case "asc":
                setSortConfig({ key, direction: "desc" });
                break;
            case "desc":
                setSortConfig({ key, direction: null });
                break;
            case null:
            default:
                setSortConfig({ key, direction: "asc" });
                break;
        }
    };

    const handleAddUser = () => {
        console.log("Add User clicked");
        // Implementation for adding a new user
        // This would typically open a modal or navigate to a form
        // Note: For center admin, new users should be assigned to their center by default
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleRoleFilterChange = (role: string) => {
        setRoleFilter(role);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Filter available roles for center admin (can only create center_admin and volunteer)
    const getAvailableRoles = () => {
        if (userRole === "center_admin") {
            return [
                { value: "all", label: "All Roles" },
                { value: "center_admin", label: "Center Admin" },
                { value: "volunteer", label: "Volunteer" },
            ];
        }
        return [
            { value: "all", label: "All Roles" },
            { value: "super_admin", label: "Super Admin" },
            { value: "city_admin", label: "City Admin" },
            { value: "center_admin", label: "Center Admin" },
            { value: "volunteer", label: "Volunteer" },
        ];
    };

    // Build additional filters component
    const additionalFilters = (
        <>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange} disabled={loading}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    {getAvailableRoles().map(role => (
                        <SelectItem key={role.value} value={role.value}>
                            {role.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
                disabled={loading}
            >
                <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
        </>
    );

    // Display current center information
    const currentCenterInfo = user?.center_name ? `for ${user.center_name}` : '';

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage users for your evacuation center {currentCenterInfo}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}

                {/* Main Table Card */}
                <div className="border border-border rounded-lg">
                    {/* Card Header */}
                    <div className="bg-card border-b border-border p-4">
                        <h3 className="font-semibold text-base text-foreground">
                            User List {currentCenterInfo}
                        </h3>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddItem={handleAddUser}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            searchPlaceholder="Search by email..."
                            addButtonText="Add User"
                            additionalFilters={additionalFilters}
                        />
                    </div>

                    {/* Table Section */}
                    <div className="border-b border-border">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">Loading users...</div>
                            </div>
                        ) : (
                            <UserTable
                                data={users}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                loading={loading}
                                userRole={userRole}
                            />
                        )}
                    </div>

                    {/* Pagination Section */}
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={pagination?.total_items || 0}
                            onPageChange={handlePageChange}
                            loading={loading}
                            entriesLabel="users"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}