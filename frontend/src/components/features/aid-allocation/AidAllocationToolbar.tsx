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
import { 
    Search, 
    Plus
} from "lucide-react";
import { useAuthStore } from "@/store/authStore"; // Import auth store

interface AidDistributionToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddAllocation: () => void;
    entriesPerPage: number;
    onEntriesPerPageChange: (entries: number) => void;
    loading: boolean;
    searchPlaceholder?: string;
    addButtonText?: string;
    showEntriesSelector?: boolean;
    showFilters?: boolean;
    filters?: {
        status?: string;
        date?: string;
        centerId?: string;
        categoryId?: string;
    };
    onFilterChange?: (filters: any) => void;
    centers?: Array<{ id: number; name: string }>;
    categories?: Array<{ id: number; name: string }>;
    showCenterFilter?: boolean;
    showCategoryFilter?: boolean;
}

function AidDistributionToolbarComponent({
    searchQuery,
    onSearchChange,
    onAddAllocation,
    entriesPerPage,
    onEntriesPerPageChange,
    loading,
    searchPlaceholder = "Search allocations...",
    addButtonText = "Allocate Aid",
    showEntriesSelector = true
}: AidDistributionToolbarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Get user from auth store
    const { user } = useAuthStore();
    const userRole = user?.role || "city_admin"; // Default to city_admin if no user
    
    // Determine if Add button should be shown based on user role
    const showAddButton = ["super_admin", "city_admin"].includes(userRole);

    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            inputRef.current?.focus();
        }
    }, [loading]);

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Section: Search and Add Button */}
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
                    />
                </div>
                
                {/* Conditionally show Add button based on user role */}
                {showAddButton && (
                    <Button 
                        onClick={onAddAllocation} 
                        disabled={loading} 
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {addButtonText}
                    </Button>
                )}
            </div>

            {/* Right Section: Filters and Entries Selector */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Entries per page selector */}
                {showEntriesSelector && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show</span>
                        <Select
                            value={entriesPerPage.toString()}
                            onValueChange={(val: string) => onEntriesPerPageChange(Number(val))}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue placeholder="Entries" />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map(count => (
                                    <SelectItem key={count} value={count.toString()}>
                                        {count}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">entries</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export const AidDistributionToolbar = memo(AidDistributionToolbarComponent);