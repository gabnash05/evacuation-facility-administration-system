"use client";

import { useRef, useEffect, memo, useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AttendanceTableToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onCheckIn: () => void;
    onOpenCheckOut?: () => void;
    onOpenTransfer?: () => void;
    entriesPerPage: number;
    onEntriesPerPageChange: (entries: number) => void;
    loading: boolean;
    filters?: {
        status: string;
        gender: string;
        ageGroup: string;
        centerId?: number;
    };
    onFilterChange: (type: string, value: string | number) => void;
    onClearFilters: () => void;
    centers?: Array<{ center_id: number; center_name: string }>;
    userRole?: string;
    userCenterId?: number;
}

function AttendanceTableToolbarV2Component({
    searchQuery,
    onSearchChange,
    onCheckIn,
    onOpenCheckOut,
    onOpenTransfer,
    entriesPerPage,
    onEntriesPerPageChange,
    loading,
    filters = { status: "all", gender: "all", ageGroup: "all" },
    onFilterChange,
    onClearFilters,
    centers = [],
    userRole,
    userCenterId,
}: AttendanceTableToolbarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            inputRef.current?.focus();
        }
    }, [loading]);

    const hasActiveFilters = (
        filters.status !== "all" ||
        filters.gender !== "all" ||
        filters.ageGroup !== "all" ||
        (filters.centerId && filters.centerId !== userCenterId)
    );

    // Clear all filters
    const handleClearAllFilters = () => {
        onClearFilters();
        setShowFilters(false);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* First Row: Search, Buttons, and Entries */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left Side: Search and Main Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Search individuals by name..."
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            className="pl-10 w-full"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={onCheckIn} 
                            disabled={loading}
                            className="flex-shrink-0"
                        >
                            Check In
                        </Button>
                        <Button 
                            onClick={() => onOpenCheckOut && onOpenCheckOut()} 
                            disabled={loading}
                            className="flex-shrink-0"
                        >
                            Check Out
                        </Button>
                        <Button 
                            onClick={() => onOpenTransfer && onOpenTransfer()} 
                            disabled={loading}
                            className="flex-shrink-0"
                        >
                            Transfer
                        </Button>
                    </div>
                </div>

                {/* Right Side: Entries per page selector */}
                <div className="flex items-center gap-2 justify-end">
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
            </div>

            {/* Second Row: Filters Section */}
            <div className="flex flex-col gap-3">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="h-8"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {hasActiveFilters && (
                                <Badge 
                                    variant="secondary" 
                                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                                >
                                    {[
                                        filters.status !== "all",
                                        filters.gender !== "all",
                                        filters.ageGroup !== "all",
                                        (filters.centerId && filters.centerId !== userCenterId)
                                    ].filter(Boolean).length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                    
                    {hasActiveFilters && showFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllFilters}
                            className="h-8 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Filter Controls - Only shown when toggled */}
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-lg bg-card">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => onFilterChange("status", value)}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="checked_in">Checked In</SelectItem>
                                    <SelectItem value="checked_out">Checked Out</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Gender Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Gender</label>
                            <Select
                                value={filters.gender}
                                onValueChange={(value) => onFilterChange("gender", value)}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Genders" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genders</SelectItem>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Age Group Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Age Group</label>
                            <Select
                                value={filters.ageGroup}
                                onValueChange={(value) => onFilterChange("age_group", value)}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Age Groups" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Age Groups</SelectItem>
                                    <SelectItem value="child">Children (&lt;18)</SelectItem>
                                    <SelectItem value="young_adult">Young Adult (18-34)</SelectItem>
                                    <SelectItem value="middle_aged">Middle Aged (35-59)</SelectItem>
                                    <SelectItem value="senior">Senior (60+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Center Filter - Only for city_admin and super_admin */}
                        {(userRole === "city_admin" || userRole === "super_admin") && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Center</label>
                                <Select
                                    value={filters.centerId?.toString() || "all"}
                                    onValueChange={(value) => {
                                        if (value === "all") {
                                            onFilterChange("center_id", "all");
                                        } else {
                                            onFilterChange("center_id", parseInt(value));
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Centers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Centers</SelectItem>
                                        {centers.map(center => (
                                            <SelectItem 
                                                key={center.center_id} 
                                                value={center.center_id.toString()}
                                            >
                                                {center.center_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Filter Badges - Always visible when filters are active */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {filters.status !== "all" && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs">
                                Status: {filters.status.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                            </Badge>
                        )}
                        {filters.gender !== "all" && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs">
                                Gender: {filters.gender}
                            </Badge>
                        )}
                        {filters.ageGroup !== "all" && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs">
                                Age: {filters.ageGroup.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                            </Badge>
                        )}
                        {filters.centerId && centers.find(c => c.center_id === filters.centerId) && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs">
                                Center: {centers.find(c => c.center_id === filters.centerId)?.center_name}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export const AttendanceTableToolbarV2 = memo(AttendanceTableToolbarV2Component);