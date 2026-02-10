import { useEffect, useState, useMemo, useCallback } from "react";
import { useDistributionStore } from "@/store/distributionStore";
import { useAuthStore } from "@/store/authStore";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { DistributeAidModal } from "@/components/features/distribution/DistributeAidModal";
import { EditDistributionModal } from "@/components/features/distribution/EditDistributionModal";
import { DistributionHistoryTable } from "@/components/features/distribution/DistributionHistoryTable";
import { DeleteConfirmationModal } from "@/components/features/user-management/DeleteConfirmationModal";
import type { DistributionRecord } from "@/types/distribution";
import { debounce } from "@/utils/helpers";

export function CityAdminDistributionPage() {
    const { user } = useAuthStore();
    const { 
        history, 
        searchQuery, 
        setSearchQuery, 
        fetchData, 
        deleteDistribution,
        currentPage, 
        setCurrentPage,
        entriesPerPage, 
        setEntriesPerPage,
        isLoading,
        pagination,
        setSortColumn,
        setSortDirection,
        sortColumn,
        sortDirection
    } = useDistributionStore();

    // Local state for debounced search
    const [localSearch, setLocalSearch] = useState(searchQuery);
    
    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<DistributionRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<DistributionRecord | null>(null);

    // Create debounced fetch function
    const debouncedFetchData = useMemo(
        () => debounce(() => fetchData(), 500),
        [fetchData]
    );

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        debouncedFetchData();
    }, [
        searchQuery,
        currentPage,
        entriesPerPage,
        sortColumn,
        sortDirection,
        debouncedFetchData // Add this to dependencies
    ]);

    // Debounce effect for search - similar to other pages
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
                setCurrentPage(1); // Reset to first page when searching
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [localSearch, searchQuery, setSearchQuery, setCurrentPage]);

    // Sync local search with store when component mounts or store changes externally
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Handle sort
    const handleSort = useCallback((column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("desc");
        }
        setCurrentPage(1); // Reset to first page when sorting
    }, [sortColumn, sortDirection, setSortColumn, setSortDirection, setCurrentPage]);

    // Server-side pagination data
    const totalPages = pagination?.total_pages || 1;
    const totalEntries = pagination?.total_items || 0;

    const handleDelete = async () => {
        if (deleteRecord) {
            await deleteDistribution(deleteRecord.distribution_id);
            setDeleteRecord(null);
            // Refresh data after deletion
            debouncedFetchData();
        }
    };

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aid Distribution</h1>
                    <p className="text-muted-foreground">
                        Manage city-wide distribution records.
                    </p>
                </div>

                <div className="border border-border rounded-lg">
                    {/* Toolbar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={localSearch} // Use local search state
                            onSearchChange={setLocalSearch} // Update local state
                            onAddItem={() => setIsCreateOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={setEntriesPerPage}
                            loading={isLoading}
                            searchPlaceholder="Search household or item..."
                            addButtonText="New Distribution"
                        />
                    </div>

                    {/* Table */}
                    <div className="border-b border-border">
                        {isLoading && history.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">Loading distribution records...</div>
                            </div>
                        ) : (
                            <DistributionHistoryTable 
                                data={history}
                                loading={isLoading}
                                userRole={user?.role}
                                onEdit={setEditRecord}
                                onDelete={setDeleteRecord}
                                onSort={handleSort}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                            />
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={totalEntries}
                            onPageChange={setCurrentPage}
                            loading={isLoading}
                            entriesLabel="records"
                        />
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <DistributeAidModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />

            {/* Edit Modal */}
            <EditDistributionModal
                isOpen={!!editRecord}
                record={editRecord}
                onClose={() => setEditRecord(null)}
            />

            {/* Delete Modal */}
            <DeleteConfirmationModal
                isOpen={!!deleteRecord}
                onClose={() => setDeleteRecord(null)}
                onConfirm={handleDelete}
                title="Delete Record"
                description={`Are you sure you want to delete the distribution of ${deleteRecord?.quantity} ${deleteRecord?.resource_name} to ${deleteRecord?.household_name}?`}
            />
        </div>
    );
}