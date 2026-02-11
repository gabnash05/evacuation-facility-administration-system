"use client";

import { ChevronLeft, ChevronRight, Search, Plus, AlertCircle } from "lucide-react";
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
    onResolve?: (event: Event) => void;
    userRole?: string;
    activeEvent?: Event | null;
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
    onResolve,
    userRole,
    activeEvent,
}: EventHistoryTableProps) {
    // Check if there's an active event and user is trying to add a new one
    const hasActiveEvent = !!activeEvent;
    const canAddEvent = !hasActiveEvent; // Can't add event if one is already active
    
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

            {/* Active Event Warning */}
            {hasActiveEvent && (
                <div className="border-b border-border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                Active Event: {activeEvent.event_name}
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                There is currently an active event. You cannot create a new event until the current one is resolved.
                                Only one event can be active at a time.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Table with Event History and Pagination */}
            <div className="border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base text-foreground">Event History</h3>
                        {hasActiveEvent && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                                Active Event
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {onAddEvent && (
                            <Button
                                onClick={onAddEvent}
                                className="gap-2 h-8 px-3 text-sm"
                                disabled={isLoadingEvents || !canAddEvent}
                                title={!canAddEvent ? "Cannot add event while another event is active" : ""}
                            >
                                <Plus className="h-4 w-4" />
                                Add Event
                                {!canAddEvent && (
                                    <AlertCircle className="h-3 w-3 ml-1" />
                                )}
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
                                onResolve={onResolve}
                                onRowClick={onRowClick}
                                userRole={userRole}
                                activeEventId={activeEvent?.event_id} // Pass active event ID for highlighting
                            />
                            {paginatedData.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <Search className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">No events found</p>
                                    {hasActiveEvent && (
                                        <p className="text-sm text-center max-w-md">
                                            Currently tracking: <span className="font-semibold text-foreground">{activeEvent.event_name}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}