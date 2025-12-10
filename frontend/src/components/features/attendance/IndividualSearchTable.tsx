// components/individuals/IndividualSearchTable.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X } from "lucide-react";
import { useIndividualStore } from "@/store/individualStore";
import { IndividualTablePagination } from "./IndividualTablePagination";
import type { Individual } from "@/types/individual";

interface IndividualSearchTableProps {
    onSelectIndividual: (individual: Individual) => void;
    selectedIndividuals: Individual[];
    modalSearchQuery?: string;
    onModalSearchChange?: (query: string) => void;
    modalPage?: number;
    onModalPageChange?: (page: number) => void;
    // NEW: Optional function to perform search (for modal context)
    onSearch?: (params: {
        search: string;
        page: number;
        limit: number;
    }) => Promise<{ success: boolean; data: Individual[]; totalRecords: number }>;
    // NEW: Optional loading and error states for modal context
    isLoading?: boolean;
    errorMessage?: string;
}

export function IndividualSearchTable({
    onSelectIndividual,
    selectedIndividuals,
    modalSearchQuery,
    onModalSearchChange,
    modalPage,
    onModalPageChange,
    onSearch,
    isLoading,
    errorMessage,
}: IndividualSearchTableProps) {
    // Determine if we're in modal context
    const isModalContext = onSearch !== undefined;
    
    // Store reference for modal context
    const { 
        paginatedIndividuals,
        totalRecords,
        currentPage,
        searchQuery,
        loading,
        error,
        searchIndividuals: storeSearchIndividuals,
        clearSearch: storeClearSearch,
    } = useIndividualStore();

    // Local state for BOTH contexts - this is the key fix
    const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
    const [localPage, setLocalPage] = useState<number>(1);
    const [localSearchResults, setLocalSearchResults] = useState<Individual[]>([]);
    const [localTotalRecords, setLocalTotalRecords] = useState<number>(0);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    
    const limit = 10;
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Initialize from props when they change, but only update local state
    // when the incoming prop actually differs from the current local value.

    const displayData = isModalContext ? localSearchResults : (paginatedIndividuals || []);
    const displayTotalRecords = isModalContext ? localTotalRecords : totalRecords;
    const displayLoading = isModalContext ? (isLoading || isSearching) : loading;
    const displayError = isModalContext ? errorMessage : error;

    // Debounced effect to perform searches based on local state.
    useEffect(() => {
        const cleanup = () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
        };

        // Modal context: call provided `onSearch` function
        if (isModalContext && onSearch) {
            // If search is empty and on first page, clear results
            if (localSearchQuery.trim() === "" && localPage === 1) {
                setLocalSearchResults([]);
                setLocalTotalRecords(0);
                return cleanup;
            }

            setIsSearching(true);
            // Debounce typing
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const result = await onSearch({
                        search: localSearchQuery,
                        page: localPage,
                        limit,
                    });

                    if (result && result.success) {
                        setLocalSearchResults(result.data || []);
                        setLocalTotalRecords(result.totalRecords || 0);
                    } else {
                        setLocalSearchResults([]);
                        setLocalTotalRecords(0);
                    }
                } catch (err) {
                    console.error("Modal search failed:", err);
                    setLocalSearchResults([]);
                    setLocalTotalRecords(0);
                } finally {
                    setIsSearching(false);
                }
            }, 500);

            return cleanup;
        }

        // Page context: call store search
        if (!isModalContext) {
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    await storeSearchIndividuals({
                        search: localSearchQuery,
                        page: localPage,
                        limit,
                        sortBy: "last_name",
                        sortOrder: "asc",
                    });
                } catch (err) {
                    console.error("Page search failed:", err);
                }
            }, 300);
            return cleanup;
        }

        return cleanup;
    // We only need to run when localSearchQuery/localPage change or when the
    // search function reference changes.
    }, [localSearchQuery, localPage, isModalContext, onSearch, limit, storeSearchIndividuals]);

    const totalPages = Math.ceil(displayTotalRecords / limit);

    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);
        setLocalPage(1); // Reset to first page on new search
    };

    const handlePageChange = (newPage: number) => {
        setLocalPage(newPage);
    };

    const handleClearSearch = () => {
        setLocalSearchQuery("");
        setLocalPage(1);
        if (isModalContext) {
            setLocalSearchResults([]);
            setLocalTotalRecords(0);
        } else {
            storeClearSearch();
        }
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
                    {displayLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            Searching individuals...
                        </div>
                    ) : displayError ? (
                        <div className="p-4 text-center text-destructive">
                            Error loading individuals: {displayError}
                        </div>
                    ) : displayData.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {localSearchQuery
                                ? "No individuals match your search"
                                : "Enter a name or ID to search"}
                        </div>
                    ) : (
                        <>
                            <div className="max-h-60 overflow-y-auto divide-y">
                                {displayData.map(individual => {
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
                                    currentPage={localPage}
                                    totalPages={totalPages}
                                    totalRecords={displayTotalRecords}
                                    onPageChange={handlePageChange}
                                    loading={displayLoading}
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