"use client";

import { useState, useEffect } from "react";
import { AidDistributionTable } from "@/components/features/aid-allocation/AidAllocationTable";
import { AidDistributionToolbar } from "@/components/features/aid-allocation/AidAllocationToolbar";
import { AidAllocationForm } from "@/components/features/aid-allocation/AidAllocationForm";
import { EditAllocationForm } from "@/components/features/aid-allocation/EditAllocationForm"; // Add this import
import { TablePagination } from "@/components/common/TablePagination";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SuccessToast } from "@/components/common/SuccessToast";
import { useAidAllocationStore } from "../../store/aidAllocationStore";
import { useAuthStore } from "@/store/authStore";

export function CityAdminAidAllocationPage() {
    
    // Use aid allocation store
    const {
        allocations,
        loading,
        error,
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        setSearchQuery,
        setCurrentPage,
        setEntriesPerPage,
        setSortConfig,
        fetchAllocations,
        createAllocation,
        updateAllocation, // Make sure this exists in your store
        deleteAllocation,
        pagination,
    } = useAidAllocationStore();
    
    // Get user from auth store
    const { user } = useAuthStore();
    const userRole = user?.role || "city_admin";
    
    // Form State
    const [showAllocationForm, setShowAllocationForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
    
    // Success toast
    const [successToast, setSuccessToast] = useState({
        isOpen: false,
        message: "",
    });

    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch allocations when any filter/search/sort changes
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchAllocations();
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery, entriesPerPage, currentPage, sortConfig]);

    const handleSort = (column: string) => {
        if (sortConfig?.key !== column) {
            setSortConfig({ key: column, direction: "asc" });
        } else if (sortConfig.direction === "asc") {
            setSortConfig({ key: column, direction: "desc" });
        } else {
            setSortConfig(null);
        }
        setCurrentPage(1);
    };

    const handleAllocationSubmit = async (data: any) => {
        try {
            await createAllocation(data);
            showSuccessToast("Aid allocation created successfully");
            setShowAllocationForm(false);
            fetchAllocations();
        } catch (error) {
            console.error("Error creating allocation:", error);
        }
    };

    const handleEditAllocation = (allocation: any) => {
        setSelectedAllocation(allocation);
        setShowEditForm(true);
    };

    const handleUpdateAllocation = async (id: number, data: any) => {
        try {
            await updateAllocation(id, data);
            showSuccessToast("Allocation updated successfully");
            setShowEditForm(false);
            setSelectedAllocation(null);
            fetchAllocations();
        } catch (error: any) {
            console.error("Error updating allocation:", error);
            // Throw so that EditAllocationForm can display the error inline
            throw error;
        }
    };

    const handleDeleteAllocation = async (allocation: any) => {
        setIsDeleting(true);
        try {
            await deleteAllocation(allocation.allocation_id);
            showSuccessToast("Allocation deleted successfully");
            fetchAllocations();
        } catch (error: any) {
            console.error("Error deleting allocation:", error);
            setSuccessToast({ 
                isOpen: true, 
                message: error.message || "Failed to delete allocation" 
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // NEW: Cancel action for City Admin (does not open edit modal)
    const handleCancelAllocation = async (allocation: any) => {
        if (!allocation) return;
        // Only proceed if allocation is active
        if (allocation.status?.toLowerCase() !== "active" && allocation.status?.toLowerCase() !== "depleted") return;

        try {
            await updateAllocation(allocation.allocation_id, { status: "cancelled" });
            showSuccessToast("Allocation cancelled");
            fetchAllocations();
        } catch (error: any) {
            console.error("Error cancelling allocation:", error);
            setSuccessToast({
                isOpen: true,
                message: error.message || "Failed to cancel allocation"
            });
        }
    };

    const handleDistribute = (allocation: any) => {
        console.log("Distribute allocation:", allocation);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const showSuccessToast = (message: string) => {
        setSuccessToast({ isOpen: true, message });
    };

    // Simplified allocations table columns
    const allocationColumns = [
        { key: "created_at", label: "Date", sortable: true },
        { key: "center_name", label: "Center", sortable: true },
        { key: "category_name", label: "Category", sortable: true},
        { key: "resource_name", label: "Relief Type", sortable: true },
        { key: "remaining_quantity", label: "Quantity", sortable: true },
        { key: "status", label: "Status", sortable: true },
    ];

    // Determine if edit/delete should be enabled based on user role
    const canEdit = userRole === "super_admin"; // ONLY super_admin can edit
    const canDelete = userRole === "super_admin";

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aid Allocation</h1>
                    <p className="text-muted-foreground">
                        Manage aid allocations and distributions across all centers
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}

                {/* Tabs (only Allocations) */}
                <Tabs defaultValue="allocations" className="space-y-4">
                    <TabsContent value="allocations" className="space-y-4">
                        <div className="border border-border rounded-lg">
                            <div className="bg-card border-b border-border p-4">
                                <AidDistributionToolbar
                                    searchQuery={searchQuery}
                                    onSearchChange={handleSearchChange}
                                    onAddAllocation={() => setShowAllocationForm(true)}
                                    entriesPerPage={entriesPerPage}
                                    onEntriesPerPageChange={handleEntriesPerPageChange}
                                    loading={loading}
                                    searchPlaceholder="Search allocations"
                                    addButtonText="Allocate Aid"
                                    showCenterFilter={false}
                                    showCategoryFilter={false}
                                />
                            </div>
                            <div className="border-b border-border">
                                {loading && allocations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-muted-foreground">
                                            Loading allocations...
                                        </div>
                                    </div>
                                ) : (
                                    <AidDistributionTable
                                        columns={allocationColumns}
                                        data={allocations}
                                        onSort={handleSort}
                                        sortColumn={sortConfig?.key}
                                        sortDirection={sortConfig?.direction || undefined}
                                        onEdit={canEdit ? handleEditAllocation : undefined}
                                        onDelete={canDelete ? handleDeleteAllocation : undefined}
                                        onDistribute={handleDistribute}
                                        onCancel={userRole === "city_admin" ? handleCancelAllocation : undefined} // NEW
                                        showActions={true}
                                        deleteLoading={isDeleting}
                                        userRole={userRole}
                                    />
                                )}
                            </div>
                            <div className="bg-card p-4">
                                <TablePagination
                                    currentPage={currentPage}
                                    entriesPerPage={entriesPerPage}
                                    totalEntries={pagination?.total_items ?? allocations.length}
                                    onPageChange={handlePageChange}
                                    loading={loading}
                                    entriesLabel="allocations"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Create Allocation Form Modal */}
            <AidAllocationForm
                isOpen={showAllocationForm}
                onClose={() => setShowAllocationForm(false)}
                onSubmit={handleAllocationSubmit}
                title="Allocate Aid to Center"
                submitText="Allocate"
            />

            {/* Edit Allocation Form Modal */}
            {selectedAllocation && (
                <EditAllocationForm
                    isOpen={showEditForm}
                    onClose={() => {
                        setShowEditForm(false);
                        setSelectedAllocation(null);
                    }}
                    onSubmit={handleUpdateAllocation}
                    allocation={selectedAllocation}
                    title={userRole === "city_admin" ? "Cancel Allocation" : "Edit Allocation"}
                    submitText={userRole === "city_admin" ? "Confirm Cancellation" : "Update Allocation"}
                    userRole={userRole} // Pass user role (optional)
                />
            )}

            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}