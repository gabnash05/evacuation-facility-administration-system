// components/individuals/IndividualTablePagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IndividualTablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
    pageSize: number;
}

export function IndividualTablePagination({
    currentPage,
    totalPages,
    totalRecords,
    onPageChange,
    loading = false,
    pageSize,
}: IndividualTablePaginationProps) {
    const getVisiblePages = () => {
        const pages = [];
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, startPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const visiblePages = getVisiblePages();
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalRecords);

    return (
        <div className="flex items-center justify-between p-3 border-t bg-muted/20">
            <div className="text-sm text-muted-foreground">
                Showing {startItem}-{endItem} of {totalRecords} individuals
            </div>

            <div className="flex items-center space-x-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {visiblePages.map(pageNum => (
                    <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="h-8 w-8 p-0"
                        disabled={loading}
                    >
                        {pageNum}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
