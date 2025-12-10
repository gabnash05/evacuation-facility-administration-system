import { useEffect, useState, useMemo } from "react";
import { useDistributionStore } from "@/store/distributionStore";
import { useAuthStore } from "@/store/authStore";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { DistributeAidModal } from "@/components/features/distribution/DistributeAidModal";
import { EditDistributionModal } from "@/components/features/distribution/EditDistributionModal";
import { DistributionHistoryTable } from "@/components/features/distribution/DistributionHistoryTable";
import { DeleteConfirmationModal } from "@/components/features/user-management/DeleteConfirmationModal";
import type { DistributionRecord } from "@/types/distribution";

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
        isLoading 
    } = useDistributionStore();

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<DistributionRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<DistributionRecord | null>(null);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtering
    const filteredData = useMemo(() => {
        if (!searchQuery) return history;
        const lower = searchQuery.toLowerCase();
        return history.filter(h => 
            h.household_name.toLowerCase().includes(lower) ||
            h.resource_name.toLowerCase().includes(lower)
        );
    }, [history, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const handleDelete = async () => {
        if (deleteRecord) {
            await deleteDistribution(deleteRecord.distribution_id);
            setDeleteRecord(null);
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
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
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
                        <DistributionHistoryTable 
                            data={paginatedData} 
                            loading={isLoading}
                            userRole={user?.role} // Pass role to enable Super Admin features
                            onEdit={setEditRecord}
                            onDelete={setDeleteRecord}
                        />
                    </div>

                    {/* Pagination */}
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={filteredData.length}
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

            {/* Edit Modal (Super Admin only trigger via table) */}
            <EditDistributionModal
                isOpen={!!editRecord}
                record={editRecord}
                onClose={() => setEditRecord(null)}
            />

            {/* Delete Modal (Super Admin only trigger via table) */}
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