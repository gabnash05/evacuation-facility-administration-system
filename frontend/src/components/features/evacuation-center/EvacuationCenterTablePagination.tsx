import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvacuationCenterTablePaginationProps {
    currentPage: number;
    entriesPerPage: number;
    totalEntries: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
}

export function EvacuationCenterTablePagination({
    currentPage,
    entriesPerPage,
    totalEntries,
    onPageChange,
    loading = false,
}: EvacuationCenterTablePaginationProps) {
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
    const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
    const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

    // Calculate the 5-page sliding window
    const getVisiblePages = () => {
        let startPage = Math.max(1, currentPage - 4);
        let endPage = Math.min(totalPages, startPage + 4);

        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                Showing {startEntry} to {endEntry} of {totalEntries} entries
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                    className="h-9"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {/* Show first page and ellipsis if needed */}
                    {visiblePages[0] > 1 && (
                        <>
                            <Button
                                variant={currentPage === 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(1)}
                                className="h-9 w-9 p-0"
                                disabled={loading}
                            >
                                1
                            </Button>
                            {visiblePages[0] > 2 && (
                                <span className="px-2 text-sm text-muted-foreground">...</span>
                            )}
                        </>
                    )}

                    {/* Visible page numbers */}
                    {visiblePages.map(page => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="h-9 w-9 p-0"
                            disabled={loading}
                        >
                            {page}
                        </Button>
                    ))}

                    {/* Show last page and ellipsis if needed */}
                    {visiblePages[visiblePages.length - 1] < totalPages && (
                        <>
                            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                                <span className="px-2 text-sm text-muted-foreground">...</span>
                            )}
                            <Button
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(totalPages)}
                                className="h-9 w-9 p-0"
                                disabled={loading}
                            >
                                {totalPages}
                            </Button>
                        </>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalEntries === 0 || loading}
                    className="h-9"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
