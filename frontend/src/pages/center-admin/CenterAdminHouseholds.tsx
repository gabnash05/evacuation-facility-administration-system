import { useEffect, useMemo, useState } from "react";
import { HouseholdTable } from "@/components/features/household/HouseholdTable";
import { HouseholdTableToolbar } from "@/components/features/household/HouseholdTableToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { AddHouseholdModal } from "@/components/features/household/AddHouseholdModal";
import { EditHouseholdModal } from "@/components/features/household/EditHouseholdModal";
import { SuccessToast } from "@/components/common/SuccessToast";
import { useHouseholdStore } from "@/store/householdStore";
import { useUserStore } from "@/store/userStore";
import { debounce } from "@/utils/helpers";

export function CenterAdminHouseholdsPage() {
    const {
        households,
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
        fetchHouseholds,
        deleteHousehold,
    } = useHouseholdStore();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [successToast, setSuccessToast] = useState({
        isOpen: false,
        message: "",
    });

    // Get current user's center ID
    const { currentUser, initializeCurrentUser } = useUserStore();
    const centerId = currentUser?.center_id;

    useEffect(() => {
        initializeCurrentUser();
    }, [initializeCurrentUser]);

    useEffect(() => {
        if (centerId) {
            fetchHouseholds(centerId);
        }
    }, [centerId, fetchHouseholds, searchQuery, currentPage, entriesPerPage, sortConfig]);

    const debouncedFetchHouseholds = useMemo(
        () =>
            debounce(() => {
                if (centerId) {
                    fetchHouseholds(centerId);
                }
            }, 500),
        [fetchHouseholds, centerId]
    );

    useEffect(() => {
        if (centerId) {
            if (searchQuery || entriesPerPage !== 10) {
                debouncedFetchHouseholds();
            } else {
                fetchHouseholds(centerId);
            }
        }
    }, [
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        fetchHouseholds,
        debouncedFetchHouseholds,
        centerId,
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

    const handleOpenEditModal = (id: number) => {
        setSelectedHouseholdId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteHousehold(id);
            showSuccessToast("Household deleted successfully");
        } catch (error) {
            console.error("Error deleting household:", error);
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

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const showSuccessToast = (message: string) => {
        setSuccessToast({ isOpen: true, message });
    };

    const headers = [
        { key: "householdName", label: "Household Name", sortable: true },
        { key: "householdHead", label: "Household Head", sortable: true },
        { key: "address", label: "Address", sortable: true },
    ];

    // Transform household data for the table
    const tableData = households.map(household => ({
        household_id: household.household_id,
        householdName: household.household_name,
        householdHead: household.household_head
            ? `${household.household_head.first_name} ${household.household_head.last_name}`
            : "No head assigned",
        address: household.address || "No address",
    }));

    if (!centerId) {
        return (
            <div className="p-6">
                <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            Error: No evacuation center assigned to your account.
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Household Management</h1>
                    <p className="text-muted-foreground">
                        View and manage household records for your center.
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
                        <h3 className="font-semibold text-base text-foreground">Household List</h3>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-card border-b border-border p-4">
                        <HouseholdTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddHousehold={() => setIsAddModalOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                        />
                    </div>

                    {/* Table Section */}
                    <div className="border-b border-border">
                        {loading && households.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">Loading households...</div>
                            </div>
                        ) : (
                            <HouseholdTable
                                headers={headers}
                                data={tableData}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                onEdit={handleOpenEditModal}
                                onDelete={handleDelete}
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
                            entriesLabel="households"
                        />
                    </div>
                </div>
            </div>

            {/* Add Household Modal */}
            <AddHouseholdModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    showSuccessToast("Household created successfully");
                    if (centerId) fetchHouseholds(centerId);
                }}
                defaultCenterId={centerId}
            />

            {/* Edit Household Modal */}
            <EditHouseholdModal
                isOpen={isEditModalOpen}
                householdId={selectedHouseholdId}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    showSuccessToast("Household updated successfully");
                    if (centerId) fetchHouseholds(centerId);
                }}
            />

            {/* Global Success Toast */}
            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}
