import { useEffect, useMemo, useState } from "react";
import { EvacuationCenterTable } from "@/components/features/evacuation-center/EvacuationCenterTable";
import { EvacuationCenterTableToolbar } from "@/components/features/evacuation-center/EvacuationCenterTableToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { AddEvacuationCenterForm } from "@/components/features/evacuation-center/AddEvacuationCenterForm";
import { SuccessToast } from "@/components/features/evacuation-center/SuccessToast";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { debounce } from "@/utils/helpers";

export function CityAdminCentersPage() {
    const {
        centers,
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
        fetchCenters,
    } = useEvacuationCenterStore();

    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [successToast, setSuccessToast] = useState({
        isOpen: false,
        message: "",
    });

    const debouncedFetchCenters = useMemo(
        () => debounce(() => fetchCenters(), 500),
        [fetchCenters]
    );

    useEffect(() => {
        if (searchQuery || entriesPerPage !== 10) {
            debouncedFetchCenters();
        } else {
            fetchCenters();
        }
    }, [searchQuery, currentPage, entriesPerPage, sortConfig, fetchCenters, debouncedFetchCenters]);

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

    const handleAddCenter = () => {
        setIsAddFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsAddFormOpen(false);
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

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Evacuation Centers</h1>
                    <p className="text-muted-foreground">
                        Manage evacuation centers and their information
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
                        <h3 className="font-semibold text-base text-foreground">Center List</h3>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-card border-b border-border p-4">
                        <EvacuationCenterTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddCenter={handleAddCenter}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                        />
                    </div>

                    {/* Table Section */}
                    <div className="border-b border-border">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">Loading centers...</div>
                            </div>
                        ) : (
                            <EvacuationCenterTable
                                data={centers}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                loading={loading}
                                onShowSuccessToast={showSuccessToast}
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
                        />
                    </div>
                </div>
            </div>

            {/* Add Center Form Modal */}
            <AddEvacuationCenterForm
                isOpen={isAddFormOpen}
                onClose={handleCloseForm}
                onShowSuccessToast={showSuccessToast}
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
