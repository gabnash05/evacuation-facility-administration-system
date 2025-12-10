"use client";

import { useRef, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

interface TableToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddItem: () => void;
    entriesPerPage: number;
    onEntriesPerPageChange: (entries: number) => void;
    loading: boolean;
    searchPlaceholder?: string;
    addButtonText?: string;
    showEntriesSelector?: boolean;
    additionalFilters?: React.ReactNode;
    addButtonDisabled?: boolean;
}

/**
 * General Purpose Table Toolbar
 * Includes search input, entries per page selector, and Add button.
 * Optimized with React.memo to prevent re-renders and preserve focus even after data refresh.
 */
function TableToolbarComponent({
    searchQuery,
    onSearchChange,
    onAddItem,
    entriesPerPage,
    onEntriesPerPageChange,
    loading,
    searchPlaceholder = "Search",
    addButtonText = "Add Item",
    showEntriesSelector = true,
    additionalFilters,
    addButtonDisabled = false,
}: TableToolbarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            inputRef.current?.focus();
        }
    }, [loading]);

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-9"
                        disabled={loading}
                    />
                </div>
                <Button 
                    onClick={onAddItem} 
                    disabled={loading || addButtonDisabled}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {addButtonText}
                </Button>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                        value={String(entriesPerPage)}
                        onValueChange={(value) => onEntriesPerPageChange(Number(value))}
                        disabled={loading}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">entries</span>
                </div>
            </div>
        </div>
    );
}

export const TableToolbar = memo(TableToolbarComponent);
