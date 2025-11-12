"use client";

import { ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { EventsTable } from "@/components/features/events/EventsTable";
import { SearchBar } from "@/components/common/SearchBar";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/event";

interface EventHistoryTableProps {
    paginatedData: Event[];
    processedData: Event[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    entriesPerPage: number;
    onEntriesPerPageChange: (entries: number) => void;
    currentPage: number;
    onPageChange: (page: number) => void;
    totalPages: number;
    isLoadingEvents: boolean;
    onRowClick: (row: Event) => void;
    onSort: (column: string) => void;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    // Actions (optional - if provided, shows action buttons)
    onAddEvent?: () => void;
    onEdit?: (event: Event) => void;
    onDelete?: (event: Event) => void;
    userRole?: string;
}

export function EventHistoryTable({
    paginatedData,
    processedData,
    searchQuery,
    onSearchChange,
    entriesPerPage,
    onEntriesPerPageChange,
    currentPage,
    onPageChange,
    totalPages,
    isLoadingEvents,
    onRowClick,
    onSort,
    sortConfig,
    onAddEvent,
    onEdit,
    onDelete,
    userRole
}: EventHistoryTableProps) {
    return (
        <div className="p-0">
            {/* Controls Bar */}
            <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Show</span>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={entriesPerPage}
                            onChange={e => {
                                const value = parseInt(e.target.value) || 1;
                                onEntriesPerPageChange(Math.max(1, Math.min(20, value)));
                            }}
                            className="w-16 h-9 px-2 border border-border rounded-lg bg-background 
              text-foreground font-medium text-center [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:[appearance:auto] 
               hover:[&::-webkit-outer-spin-button]:appearance-auto hover:[&::-webkit-inner-spin-button]:appearance-auto"
                        />
                        <span>Entries</span>
                        <span className="ml-2 text-foreground font-medium">
                            {processedData.length > 0
                                ? `${(currentPage - 1) * entriesPerPage + 1}-${Math.min(currentPage * entriesPerPage, processedData.length)}`
                                : "0-0"}
                        </span>
                        <span>of {processedData.length}</span>
                    </div>

                    <SearchBar placeholder="Search" value={searchQuery} onChange={onSearchChange} />
                </div>
            </div>

            {/* Table with Event History and Pagination */}
            <div className="border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base text-foreground">Event History</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Add Event Button - Only shows if onAddEvent is provided */}
                        {onAddEvent && (
                            <Button
                                onClick={onAddEvent}
                                className="gap-2 h-8 px-3 text-sm"
                                disabled={isLoadingEvents}
                            >
                                <Plus className="h-4 w-4" />
                                Add Event
                            </Button>
                        )}
                        {/* Pagination */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1 || isLoadingEvents}
                                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground">
                                {currentPage}
                            </div>

                            <button
                                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || isLoadingEvents}
                                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="min-h-[234px]">
                    {isLoadingEvents ? (
                        <div className="flex justify-center items-center h-[234px]">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <>
                            {/* Always use EventsTable */}
                            <EventsTable
                                data={paginatedData}
                                sortConfig={sortConfig}
                                onSort={onSort}
                                loading={isLoadingEvents}
                                onEdit={onEdit || (() => {})}
                                onDelete={onDelete || (() => {})}
                                onRowClick={onRowClick}
                                userRole={userRole}
                            />
                            {paginatedData.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Search className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">No events found</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}