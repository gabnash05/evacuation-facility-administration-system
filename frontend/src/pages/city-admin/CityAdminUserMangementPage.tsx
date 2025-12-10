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
import { DeleteConfirmationModal } from "@/components/features/user-management/DeleteConfirmationModal";
import type { User } from "@/types/user";
import { DeactivateConfirmationModal } from "@/components/features/user-management/DeactivateConfirmationModal";

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
        deleteUser,
        deactivateUser,
        reactivateUser,
    } = useUserStore();

    const { user } = useAuthStore();
    const userRole = user?.role;

    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    

    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const debouncedFetchUsers = useMemo(() => debounce(() => fetchUsers(), 500), [fetchUsers]);

    useEffect(() => {
        if (
            searchQuery ||
            entriesPerPage !== 10 ||
            roleFilter !== "all" ||
            statusFilter !== "all"
        ) {
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
        debouncedFetchUsers,
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

    const handleConfirmDelete = () => {
        if (!selectedUser) return;
        (async () => {
            try {
                await deleteUser(selectedUser.user_id);
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
            } catch (err) {
                // store.error will be set by the action; keep modal open for retry
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
                alert(err instanceof Error ? err.message : "Failed to delete user");
            }
        })();
    };

    const handleDeactivate = (userToToggle: User) => {
        setSelectedUser(userToToggle);
        setIsDeactivateModalOpen(true);
    };

    const handleConfirmDeactivate = () => {
        if (!selectedUser) return;
        (async () => {
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
                setSelectedUser(null);
                alert(err instanceof Error ? err.message : "Failed to change user status");
            }
        })();
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
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const additionalFilters = (
        <>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange} disabled={loading}>
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
            <AddEditUserModal
                isOpen={isAddEditModalOpen}
                onClose={() => setIsAddEditModalOpen(false)}
                currentUserRole={userRole}
                userToEdit={selectedUser}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                description={`Are you sure you want to permanently delete the user "${selectedUser?.email}"? This action cannot be undone.`}
            />
            <DeactivateConfirmationModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                onConfirm={handleConfirmDeactivate}
                title={selectedUser?.is_active ? "Deactivate User" : "Reactivate User"}
                description={selectedUser?.is_active ? `Are you sure you want to deactivate ${selectedUser?.email}?` : `Are you sure you want to reactivate ${selectedUser?.email}?`}
            />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users and their permissions
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}

                <div className="border border-border rounded-lg">
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddItem={handleAddUser}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            searchPlaceholder="Search by email"
                            addButtonText="Add User"
                        />
                    </div>

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
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                                onDeactivate={handleDeactivate}
                                loading={loading}
                                userRole={userRole}
                            />
                        )}
                    </div>

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