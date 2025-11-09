import { useState, useEffect, useCallback } from "react";
import HouseholdTable, { type SortConfig } from "@/components/features/household/HouseholdTable";
import { HouseholdTableToolbar } from "@/components/features/household/HouseholdTableToolbar";
import { HouseholdTablePagination } from "@/components/features/household/HouseholdTablePagination";
import { AddHouseholdModal } from "@/components/features/household/AddHouseholdModal";
import { EditHouseholdModal } from "@/components/features/household/EditHouseholdModal";

interface PaginationState {
    page: number;
    page_count: number;
    total_records: number;
}

export function CenterAdminHouseholdsPage() {
    const [householdsData, setHouseholdsData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        page_count: 1,
        total_records: 0,
    });

    const [entriesPerPage, setEntriesPerPage] = useState(15);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);

    const fetchHouseholds = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pagination.page),
                per_page: String(entriesPerPage),
                search: debouncedSearchQuery,
                sort_by: sortConfig?.key ?? "name",
                sort_direction: sortConfig?.direction ?? "asc",
            });
            const response = await fetch(
                `http://localhost:5000/api/households?${params.toString()}`
            );
            if (!response.ok) throw new Error("Failed to fetch data");
            const result = await response.json();
            setHouseholdsData(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error("Error fetching households:", error);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, debouncedSearchQuery, sortConfig, entriesPerPage]);

    useEffect(() => {
        fetchHouseholds();
    }, [fetchHouseholds]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            if (pagination.page !== 1) setPagination(p => ({ ...p, page: 1 }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

    const handleOpenEditModal = (id: number) => {
        setSelectedHouseholdId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (
            confirm("Are you sure you want to delete this household? This action cannot be undone.")
        ) {
            try {
                const response = await fetch(`http://localhost:5000/api/households/${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) throw new Error("Failed to delete household.");
                fetchHouseholds();
            } catch (error) {
                console.error("Error deleting household:", error);
                alert("Could not delete the household. Please try again.");
            }
        }
    };

    const headers = [
        { key: "name", label: "Household Name", sortable: true },
        { key: "head", label: "Household Head", sortable: true },
        { key: "address", label: "Address", sortable: true },
    ];

    // --- NEW HANDLER ---
    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
        setPagination(p => ({ ...p, page: 1 }));
    };

    return (
        <>
            <AddHouseholdModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchHouseholds}
            />
            <EditHouseholdModal
                isOpen={isEditModalOpen}
                householdId={selectedHouseholdId}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchHouseholds}
            />
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Household Management</h1>
                    <p className="text-muted-foreground">
                        View and manage household records for your center.
                    </p>
                </div>
                <div className="border border-border rounded-lg">
                    <div className="bg-card p-4 border-b border-border">
                        <HouseholdTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onAddHousehold={() => setIsAddModalOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={isLoading}
                        />
                    </div>
                    <div className="border-b border-border">
                        {isLoading && householdsData.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading households...
                            </div>
                        ) : (
                            <HouseholdTable
                                headers={headers}
                                data={householdsData}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                onEdit={handleOpenEditModal}
                                onDelete={handleDelete}
                                loading={isLoading}
                            />
                        )}
                    </div>
                    <div className="bg-card p-4">
                        <HouseholdTablePagination
                            currentPage={pagination.page}
                            totalPages={pagination.page_count}
                            totalRecords={pagination.total_records}
                            onPageChange={page => setPagination(p => ({ ...p, page }))}
                            loading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
