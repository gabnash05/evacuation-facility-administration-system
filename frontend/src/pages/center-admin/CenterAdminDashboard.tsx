import { useState, useMemo, useEffect } from "react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { MapPanel } from "@/components/features/dashboard/MapPanel";
import { StatsRow } from "@/components/features/dashboard/StatsRow";
import { EventHistoryTable } from "@/components/features/dashboard/EventHistoryTable";
import { ErrorAlert } from "@/components/features/dashboard/ErrorAlert";
import { useEventStore } from "@/store/eventStore";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatters";
import type { Event, EventDetails } from "@/types/event";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
}

export function CenterAdminDashboard() {
    const { user } = useAuth();
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState<SelectedCenter | null>(null);
    const [isLoadingCenter, setIsLoadingCenter] = useState(true);

    // Use event store
    const {
        events,
        loading: isLoadingEvents,
        error,
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        pagination,
        setSearchQuery,
        setCurrentPage,
        setEntriesPerPage,
        setSortConfig,
        fetchEvents,
        getEventDetails,
    } = useEventStore();

    // Stats loading state
    const [isLoadingStats] = useState(false);

    // Fetch the logged-in center admin's evacuation center
    useEffect(() => {
        const fetchCenterData = async () => {
            if (!user?.center_id) {
                setIsLoadingCenter(false);
                return;
            }

            try {
                setIsLoadingCenter(true);
                const response = await EvacuationCenterService.getCenterById(user.center_id);
                
                // Backend returns: { success: true, data: { center_id, center_name, ... } }
                if (response.success && response.data) {
                    setSelectedCenter({
                        name: response.data.center_name,
                        address: response.data.address,
                        status: response.data.status,
                        capacity: response.data.capacity,
                        current_occupancy: response.data.current_occupancy,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch center data:", error);
            } finally {
                setIsLoadingCenter(false);
            }
        };

        fetchCenterData();
    }, [user?.center_id]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const getCenterStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
            case "inactive":
                return "bg-orange-100 text-orange-700 border-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-900";
            case "closed":
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
            default:
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-900";
        }
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 80) return "bg-red-500";
        if (percentage >= 60) return "bg-orange-500";
        if (percentage >= 40) return "bg-yellow-500";
        if (percentage >= 20) return "bg-lime-500";
        return "bg-green-500";
    };

    const handleRowClick = async (event: Event) => {
        try {
            const eventDetails = await getEventDetails(event.event_id);
            setSelectedEvent(eventDetails);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Event details error:", err);
        }
    };

    const handleSort = (column: string): void => {
        const currentSortConfig = sortConfig;

        if (currentSortConfig?.key === column) {
            // Cycle through: asc -> desc -> null (unsorted)
            if (currentSortConfig.direction === "asc") {
                setSortConfig({ key: column, direction: "desc" });
            } else if (currentSortConfig.direction === "desc") {
                setSortConfig(null);
            }
        } else {
            setSortConfig({ key: column, direction: "asc" });
        }
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const eventColumns = [
        { key: "event_name", label: "Event Name", className: "max-w-[150px] truncate" },
        { key: "event_type", label: "Event Type", className: "max-w-[150px] truncate" },
        { key: "date_declared", label: "Date Declared" },
        { key: "end_date", label: "End Date" },
        { key: "status", label: "Status" },
    ];

    const statsData = [
        { label: "Total Checked In", value: "300", max: "1000", percentage: 30 },
        { label: "Total Checked Out", value: "271", max: "500", percentage: 54 },
        { label: "Total Missing", value: "5", max: "", percentage: 0 },
        { label: "Total Unaccounted", value: "429", max: "1000", percentage: 43 },
    ];

    // Format events for display (only formatting, no type transformation)
    const formattedEvents = useMemo(() => {
        return events.map(event => ({
            ...event,
            status: event.status.charAt(0).toUpperCase() + event.status.slice(1),
            date_declared: formatDate(event.date_declared),
            end_date: event.end_date ? formatDate(event.end_date) : "NA",
        }));
    }, [events]);

    const processedData = useMemo(() => {
        let filtered = formattedEvents.filter(event =>
            Object.values(event).some(value =>
                value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        // Only sort if sortConfig exists and has direction
        if (sortConfig?.direction) {
            filtered = [...filtered].sort((a: any, b: any) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Handle null/undefined values
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                // String comparison (case-insensitive for text)
                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortConfig.direction === "asc"
                        ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
                        : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
                }

                // Numeric comparison
                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [formattedEvents, searchQuery, sortConfig]);

    const totalPages = pagination?.total_pages || 1;
    const paginatedData = processedData;

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, setCurrentPage]);

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative">
            <ErrorAlert error={error} />

            {/* MapPanel with real center data */}
            {selectedCenter ? (
                <MapPanel
                    isPanelVisible={isPanelVisible}
                    setIsPanelVisible={setIsPanelVisible}
                    selectedCenter={selectedCenter}
                    isLoadingCenter={isLoadingCenter}
                    getCenterStatusStyles={getCenterStatusStyles}
                    getUsageColor={getUsageColor}
                />
            ) : (
                <div className="relative w-full h-[43vh] border-b border-border flex items-center justify-center bg-muted/30 text-muted-foreground">
                    {isLoadingCenter ? (
                        <p>Loading center data...</p>
                    ) : (
                        <p>No center assigned to this account</p>
                    )}
                </div>
            )}

            <StatsRow statsData={statsData} isLoadingStats={isLoadingStats} />

            {/* EventHistoryTable WITHOUT onAddEvent prop (no Add Event button) */}
            <EventHistoryTable
                eventColumns={eventColumns}
                paginatedData={paginatedData}
                processedData={processedData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                entriesPerPage={entriesPerPage}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
                isLoadingEvents={isLoadingEvents}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortColumn={sortConfig?.key || ""}
                sortDirection={sortConfig?.direction || "asc"}
                // NO onAddEvent prop - Center Admins cannot create events
            />

            {/* Event Details Modal */}
            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />
        </div>
    );
}