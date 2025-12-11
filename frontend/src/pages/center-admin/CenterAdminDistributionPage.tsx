import { useEffect, useState, useCallback } from "react";
import { useDistributionStore } from "@/store/distributionStore";
import { useAuthStore } from "@/store/authStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { DistributeAidModal } from "@/components/features/distribution/DistributeAidModal";
import { EditDistributionModal } from "@/components/features/distribution/EditDistributionModal";
import { DistributionHistoryTable } from "@/components/features/distribution/DistributionHistoryTable";
import { DeleteConfirmationModal } from "@/components/features/user-management/DeleteConfirmationModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { DistributionRecord } from "@/types/distribution";

export function CenterAdminDistributionPage() {
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
        sortDirection,
        selectedCenterId,
        error,
        clearError
    } = useDistributionStore();
    
    // Fetch center name from evacuation center store
    const { fetchCenterById } = useEvacuationCenterStore();

    // Local state for debounced search
    const [localSearch, setLocalSearch] = useState(searchQuery);
    // State to store fetched center name
    const [centerAdminCenterName, setCenterAdminCenterName] = useState<string>("your evacuation center");
    
    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<DistributionRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<DistributionRecord | null>(null);

    // Check if center admin has an assigned center
    const hasAssignedCenter = !!user?.center_id;
    const isCenterAdmin = user?.role === 'center_admin';

    // Fetch center name when component mounts or user changes
    useEffect(() => {
        const fetchCenterName = async () => {
            if (user?.center_id) {
                try {
                    const center = await fetchCenterById(user.center_id);
                    if (center) {
                        setCenterAdminCenterName(center.center_name);
                    } else {
                        setCenterAdminCenterName("Unknown Center");
                    }
                } catch (error) {
                    console.error("Failed to fetch center name:", error);
                    setCenterAdminCenterName("Error Loading Center Name");
                }
            } else {
                setCenterAdminCenterName("your evacuation center");
            }
        };

        fetchCenterName();
    }, [user?.center_id, fetchCenterById]);

    // Debounce effect for search
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
    }, [sortColumn, sortDirection, setSortColumn, setSortDirection]);

    // Fetch data when dependencies change
    useEffect(() => {
        if (hasAssignedCenter && isCenterAdmin) {
            fetchData();
        }
    }, [fetchData, hasAssignedCenter, isCenterAdmin, currentPage, entriesPerPage, searchQuery, sortColumn, sortDirection]);

    // Server-side pagination data
    const totalPages = pagination?.total_pages || 1;
    const totalEntries = pagination?.total_items || 0;

    const handleDelete = async () => {
        if (deleteRecord) {
            await deleteDistribution(deleteRecord.distribution_id);
            setDeleteRecord(null);
        }
    };

    // Clear errors when component unmounts
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // If user is not a center admin, show access denied
    if (!isCenterAdmin) {
        return (
            <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Aid Distribution</h1>
                        <p className="text-muted-foreground">
                            Manage distribution records for your evacuation center.
                        </p>
                    </div>
                    
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Access denied. This page is only available for center administrators.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (!hasAssignedCenter) {
        return (
            <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Aid Distribution</h1>
                        <p className="text-muted-foreground">
                            Manage distribution records for your evacuation center.
                        </p>
                    </div>
                    
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            You have not been assigned to an evacuation center. Please contact a city administrator to get assigned to a center before you can manage distributions.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aid Distribution</h1>
                    <p className="text-muted-foreground">
                        Manage distribution records for your evacuation center: <span className="font-semibold text-foreground">{centerAdminCenterName}</span>
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="border border-border rounded-lg">
                    {/* Toolbar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={localSearch}
                            onSearchChange={setLocalSearch}
                            onAddItem={() => setIsCreateOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={setEntriesPerPage}
                            loading={isLoading}
                            searchPlaceholder="Search household or item"
                            addButtonText="New Distribution"
                            addButtonDisabled={!selectedCenterId}
                        />
                        {selectedCenterId && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                Viewing and managing distributions for: <span className="font-medium text-foreground">
                                    {centerAdminCenterName}
                                </span>
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    Center Administrator
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="border-b border-border">
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

            {/* Create Modal - Only show if center admin has an assigned center */}
            {selectedCenterId && (
                <DistributeAidModal 
                    isOpen={isCreateOpen} 
                    onClose={() => setIsCreateOpen(false)} 
                />
            )}

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
                title="Delete Distribution Record"
                description={`Are you sure you want to delete the distribution of ${deleteRecord?.quantity} ${deleteRecord?.resource_name} to ${deleteRecord?.household_name}? This action cannot be undone.`}
            />
        </div>
    );
}