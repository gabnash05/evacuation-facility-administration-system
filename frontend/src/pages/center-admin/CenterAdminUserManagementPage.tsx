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
import { AddEditUserModal } from "@/components/features/user-management/AddEditUserModal";
// eslint-disable-next-line max-len
import { DeleteConfirmationModal } from "@/components/features/user-management/DeleteConfirmationModal";
// eslint-disable-next-line max-len
import { DeactivateConfirmationModal } from "@/components/features/user-management/DeactivateConfirmationModal";
import type { User } from "@/types/user";

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
        setCenterFilter,
        roleFilter,
        statusFilter,
        setRoleFilter,
        setStatusFilter,
        fetchUsers,
        deleteUser,
        deactivateUser,
        reactivateUser,
    } = useUserStore();

    // Get current user details
    const { user } = useAuthStore();
    const userRole = user?.role;
    const userCenterId = user?.center_id;

    // Modal States
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
    // Debounce the fetch function to prevent API spamming
    const debouncedFetchUsers = useMemo(
        () => debounce(() => fetchUsers(userCenterId), 500),
        [fetchUsers, userCenterId]
    );

    // Initial Setup: Set the store's center filter to the logged-in admin's center
    useEffect(() => {
        if (userCenterId) {
            setCenterFilter(userCenterId);
        }
    }, [userCenterId, setCenterFilter]);

    // Data Fetching Effect
    useEffect(() => {
        if (!userCenterId) return;
        if (
            searchQuery ||
            entriesPerPage !== 10 ||
            roleFilter !== "all" ||
            statusFilter !== "all"
        ) {
            debouncedFetchUsers();
        } else {
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
        userCenterId,
    ]);

    // Handlers
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
        setSelectedUser(null);
        setIsAddEditModalOpen(true);
    };

    const handleEditUser = (userToEdit: User) => {
        setSelectedUser(userToEdit);
        setIsAddEditModalOpen(true);
    };
    
    const handleDeleteUser = (userToDelete: User) => {
        setSelectedUser(userToDelete);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.user_id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            setIsDeleteModalOpen(false);
            alert(err instanceof Error ? err.message : "Failed to delete user");
        }
    };

    const handleDeactivate = (userToToggle: User) => {
        setSelectedUser(userToToggle);
        setIsDeactivateModalOpen(true);
    };

    const handleConfirmDeactivate = async () => {
        if (!selectedUser) return;
        try {
            if (selectedUser.is_active) {
                await deactivateUser(selectedUser.user_id);
            } else {
                await reactivateUser(selectedUser.user_id);
            }
            setIsDeactivateModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            setIsDeactivateModalOpen(false);
            alert(err instanceof Error ? err.message : "Failed to change user status");
        }
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

    // Filter UI Components
    const additionalFilters = (
        <div className="flex gap-2">
            <Select 
                value={roleFilter} 
                onValueChange={(value) => setRoleFilter(value === "volunteer" ? value : "all")}
                disabled={loading}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={statusFilter}
                onValueChange={(value) =>
                    setStatusFilter(value === "active" || value === "inactive" ? value : "all")
                }
                disabled={loading}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

    if (!userCenterId) {
        return (
            <div className="p-6" role="alert">
                No evacuation center assigned to your account.
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <AddEditUserModal
                isOpen={isAddEditModalOpen}
                onClose={() => setIsAddEditModalOpen(false)}
                currentUserRole={userRole}
                userToEdit={selectedUser}
                onSuccess={() => fetchUsers(userCenterId)}
            />
            
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Volunteer"
                description={
                    `Are you sure you want to permanently delete "${selectedUser?.email}"? ` +
                    "This action cannot be undone."
                }
            />

            <DeactivateConfirmationModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                onConfirm={handleConfirmDeactivate}
                title={selectedUser?.is_active ? "Deactivate User" : "Reactivate User"}
                description={selectedUser?.is_active 
                    ? `Are you sure you want to deactivate ${selectedUser?.email}?` 
                    : `Are you sure you want to reactivate ${selectedUser?.email}?`}
            />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Center Personnel</h1>
                    <p className="text-muted-foreground">
                        Manage volunteers and staff for {user?.center_name || "your center"}.
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <span className="text-sm font-medium">Error: {error}</span>
                    </div>
                )}

                <div className="border border-border rounded-lg shadow-sm">
                    {/* Toolbar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddItem={handleAddUser}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            searchPlaceholder="Search by email"
                            addButtonText="Add Volunteer"
                            // FIX: Pass filters as a prop, not as children
                            additionalFilters={additionalFilters} 
                        />
                    </div>

                    {/* Table */}
                    <div className="border-b border-border">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading personnel...
                            </div>
                        ) : (
                            <UserTable
                                data={users}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                                onDeactivate={handleDeactivate}
                                loading={loading}
                                userRole={userRole} 
                            />
                        )}
                    </div>

                    {/* Pagination */}
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
