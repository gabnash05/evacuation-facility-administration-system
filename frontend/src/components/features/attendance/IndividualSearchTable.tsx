// components/individuals/IndividualSearchTable.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X } from "lucide-react";
import { useIndividualStore } from "@/store/individualStore";
import { IndividualTablePagination } from "./IndividualTablePagination";
import type { Individual } from "@/types/individual";

interface IndividualSearchTableProps {
    onSelectIndividual: (individual: Individual) => void;
    selectedIndividuals: Individual[];
}

export function IndividualSearchTable({
    onSelectIndividual,
    selectedIndividuals,
}: IndividualSearchTableProps) {
    const {
        paginatedIndividuals,
        totalRecords,
        currentPage,
        searchQuery,
        loading,
        error,
        searchIndividuals,
        clearSearch,
    } = useIndividualStore();

    const [localSearchQuery, setLocalSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    // Safe array access
    const safePaginatedIndividuals = paginatedIndividuals || [];

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localSearchQuery !== searchQuery || page !== currentPage) {
                searchIndividuals({
                    search: localSearchQuery,
                    page,
                    limit,
                    sort_by: "last_name",
                    sort_order: "asc",
                });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [localSearchQuery, page, searchQuery, currentPage, searchIndividuals, limit]);

    const totalPages = Math.ceil(totalRecords / limit);

    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);
        setPage(1); // Reset to first page on new search
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleClearSearch = () => {
        setLocalSearchQuery("");
        setPage(1);
        clearSearch();
    };

    const isIndividualSelected = (individualId: number) => {
        return selectedIndividuals.some(ind => ind.individual_id === individualId);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search individuals by name or ID..."
                        value={localSearchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10 w-full"
                    />
                    {localSearchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSearch}
                            className="absolute right-2 top-2 h-6 w-6 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className="border rounded-lg">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            Searching individuals...
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-destructive">
                            Error loading individuals: {error}
                        </div>
                    ) : safePaginatedIndividuals.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {localSearchQuery
                                ? "No individuals match your search"
                                : "Enter a name or ID to search"}
                        </div>
                    ) : (
                        <>
                            <div className="max-h-60 overflow-y-auto divide-y">
                                {safePaginatedIndividuals.map(individual => {
                                    const isSelected = isIndividualSelected(individual.individual_id);
                                    return (
                                        <button
                                            key={individual.individual_id}
                                            onClick={() => onSelectIndividual(individual)}
                                            disabled={isSelected}
                                            className={`w-full p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                                                isSelected
                                                    ? "bg-primary/20 cursor-not-allowed"
                                                    : "hover:bg-muted/50"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="text-left flex-1">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {individual.first_name} {individual.last_name}
                                                        {isSelected && (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ID: {individual.individual_id} •
                                                        {individual.gender && ` ${individual.gender} •`}
                                                        {individual.date_of_birth &&
                                                            ` DOB: ${new Date(individual.date_of_birth).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                                                        Household {individual.household_id}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <IndividualTablePagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    totalRecords={totalRecords}
                                    onPageChange={handlePageChange}
                                    loading={loading}
                                    pageSize={limit}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}