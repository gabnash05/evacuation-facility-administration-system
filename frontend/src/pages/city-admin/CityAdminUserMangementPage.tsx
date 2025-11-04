"use client";

import { useEffect, useMemo, useState } from "react";
import { UserTable } from "@/components/features/user-management/UserTable";
import { TableToolbar } from "@/components/common/ToolBar";
import { TablePagination } from "@/components/common/TablePagination";
import { useUserStore } from "@/store/userStore";
import { debounce } from "@/utils/helpers";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function CityAdminUserManagementPage() {
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
        createUser,
    } = useUserStore();

    // Local state for role filter
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Create debounced fetch function
    const debouncedFetchUsers = useMemo(
        () => debounce(() => fetchUsers(), 500),
        [fetchUsers]
    );

    // Fetch users when dependencies change
    useEffect(() => {
        if (searchQuery || entriesPerPage !== 10 || roleFilter !== "all" || statusFilter !== "all") {
            debouncedFetchUsers();
        } else {
            fetchUsers();
        }
    }, [
        searchQuery, 
        currentPage, 
        entriesPerPage, 
        sortConfig, 
        roleFilter, 
        statusFilter,
        fetchUsers, 
        debouncedFetchUsers
    ]);

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

    // Build additional filters component
    const additionalFilters = (
        <>
            <Select
                value={roleFilter}
                onValueChange={handleRoleFilterChange}
                disabled={loading}
            >
                <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="city_admin">City Admin</SelectItem>
                    <SelectItem value="center_admin">Center Admin</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
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

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users and their permissions
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
                        <h3 className="font-semibold text-base text-foreground">User List</h3>
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