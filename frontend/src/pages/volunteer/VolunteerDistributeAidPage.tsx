import { useEffect, useState, useMemo } from "react";
import { useDistributionStore } from "@/store/distributionStore";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { DistributeAidModal } from "@/components/features/distribution/DistributeAidModal";
import { DistributionHistoryTable } from "@/components/features/distribution/DistributionHistoryTable";
import { debounce } from "@/utils/helpers";

export default function VolunteerDistributeAidPage() {
    const { 
        history, 
        searchQuery, 
        setSearchQuery, 
        fetchData, 
        currentPage, 
        setCurrentPage,
        entriesPerPage, 
        setEntriesPerPage,
        isLoading 
    } = useDistributionStore();

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Client-side filtering for the mock table (since backend isn't real)
    const filteredData = useMemo(() => {
        if (!searchQuery) return history;
        return history.filter(h => 
            h.household_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.resource_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [history, searchQuery]);

    // Pagination Logic (Client-side for mock)
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aid Distribution</h1>
                    <p className="text-muted-foreground">
                        Manage and track relief goods distribution to households.
                    </p>
                </div>

                <div className="border border-border rounded-lg">
                    {/* Toolbar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddItem={() => setIsModalOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={setEntriesPerPage}
                            loading={isLoading}
                            searchPlaceholder="Search history..."
                            addButtonText="Distribute Aid"
                        />
                    </div>

                    {/* Table */}
                    <div className="border-b border-border">
                        <DistributionHistoryTable 
                            data={paginatedData} 
                            loading={isLoading} 
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

            <DistributeAidModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}