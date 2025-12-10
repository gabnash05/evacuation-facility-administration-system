"use client";

import { useState, useEffect, useMemo } from "react";
import { AidDistributionTable } from "@/components/features/aid-allocation/AidAllocationTable";
import { AidDistributionToolbar } from "@/components/features/aid-allocation/AidAllocationToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { useAuthStore } from "@/store/authStore";
import { useAidAllocationStore } from "../../store/aidAllocationStore";
import { debounce } from "@/utils/helpers";

export function CenterAdminAidAllocationPage() {
    const { user } = useAuthStore();

    const {
        allocations,
        pagination,
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
        fetchCenterAllocations,
    } = useAidAllocationStore();

    const [filteredAllocations, setFilteredAllocations] = useState(allocations);

    const debouncedFetchData = useMemo(
        () => debounce(() => {
            if (user?.center_id) {
                fetchCenterAllocations(user.center_id);
            }
        }, 500),
        [user?.center_id, fetchCenterAllocations]
    );

    useEffect(() => {
        if (user?.center_id) {
            debouncedFetchData();
        }
    }, [user?.center_id, debouncedFetchData]);

    // REFRESH WHEN pagination-related params change so server-side paging works
    useEffect(() => {
        if (!user?.center_id) return;
        fetchCenterAllocations(user.center_id);
    }, [user?.center_id, currentPage, entriesPerPage, sortConfig, searchQuery, fetchCenterAllocations]);

    useEffect(() => {
        applyFilters();
    }, [allocations, searchQuery]);

    const applyFilters = () => {
        if (!searchQuery) {
            setFilteredAllocations(allocations);
            return;
        }

        const q = searchQuery.toLowerCase().trim();
        
        const filtered = allocations.filter(allocation => {
            const formatDateForDisplay = (dateString: string) => {
                if (!dateString) return "";
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } catch (error) {
                    return "";
                }
            };

            const formattedDate = formatDateForDisplay(allocation.created_at);
            if (formattedDate.toLowerCase().includes(q)) return true;
            
            if (allocation.center_name?.toLowerCase().includes(q)) return true;
            
            if (allocation.resource_name?.toLowerCase().includes(q)) return true;
            
            const total = allocation.total_quantity || 0;
            const remaining = allocation.remaining_quantity || 0;
            const quantityText = `${remaining} / ${total}`;
            if (quantityText.includes(q)) return true;
            
            if (allocation.status?.toLowerCase().includes(q)) return true;
            
            return false;
        });

        setFilteredAllocations(filtered);
    };

    const handleSort = (column: string) => {
        if (sortConfig?.key !== column) {
            // First click: ascending
            setSortConfig({ key: column, direction: "asc" });
        } else if (sortConfig.direction === "asc") {
            // Second click: descending
            setSortConfig({ key: column, direction: "desc" });
        } else {
            // Third click: clear sorting
            setSortConfig(null);
        }
        setCurrentPage(1); // Reset to first page when sorting changes
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

    const allocationColumns = [
        { key: "created_at", label: "Date", sortable: true },
        { key: "center_name", label: "Center", sortable: true },
        { key: "resource_name", label: "Relief Type", sortable: true },
        { key: "remaining_quantity", label: "Quantity", sortable: true },
        { key: "status", label: "Status", sortable: true },
    ];

    const paginatedAllocations = filteredAllocations;

    const totalEntries = pagination?.total_items ?? filteredAllocations.length;

    if (!user?.center_id) {
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aid Allocation</h1>
                    <p className="text-muted-foreground">
                        View allocations for {user?.center_name || "your center"}
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
                        <AidDistributionToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddAllocation={() => { /* view-only: no-op */ }}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            searchPlaceholder="Search allocations..."
                            addButtonText={""} // hide the add button text for view-only
                            showEntriesSelector={true}
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
                                title="Aid Allocations"
                                columns={allocationColumns}
                                data={paginatedAllocations}
                                onSort={handleSort}
                                sortColumn={sortConfig?.key}
                                sortDirection={sortConfig?.direction || undefined}
                                showActions={false} 
                            />
                        )}
                    </div>
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={totalEntries}
                            onPageChange={handlePageChange}
                            loading={loading}
                            entriesLabel="allocations"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}