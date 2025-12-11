import { useState, useMemo, useEffect } from "react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { MapPanel } from "@/components/features/dashboard/MapPanel";
import { StatsRow } from "@/components/features/dashboard/StatsRow"; // Updated import
import { EventHistoryTable } from "@/components/features/dashboard/EventHistoryTable";
import { ErrorAlert } from "@/components/features/dashboard/ErrorAlert";
import { useEventStore } from "@/store/eventStore";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/formatters";
import type { Event, EventDetails } from "@/types/event";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
    latitude?: number;
    longitude?: number;
}

export function CenterAdminDashboard() {
    const { user } = useAuth();
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState<SelectedCenter | null>(null);
    const [isLoadingCenter, setIsLoadingCenter] = useState(true);

    // Use evacuation center store to get all centers
    const {
        centers: evacuationCenters,
        mapCenters,
        loading: isLoadingCenters,
        fetchAllCenters,
    } = useEvacuationCenterStore();

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

    // Fetch all evacuation centers using the store
    useEffect(() => {
        const fetchAllCentersData = async () => {
            try {
                await fetchAllCenters();
            } catch (error) {
                console.error("Failed to fetch evacuation centers:", error);
            }
        };

        fetchAllCentersData();
    }, [fetchAllCenters]);

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

                if (response.success && response.data) {
                    setSelectedCenter({
                        name: response.data.center_name,
                        address: response.data.address,
                        status: response.data.status,
                        capacity: response.data.capacity,
                        current_occupancy: response.data.current_occupancy,
                        latitude: response.data.latitude,
                        longitude: response.data.longitude,
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
        if (user?.center_id) {
            fetchEvents(user.center_id);
        }
    }, [user?.center_id, fetchEvents, searchQuery, currentPage, entriesPerPage, sortConfig]);

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

        let newDirection: "asc" | "desc" | null = "asc";

        if (currentSortConfig?.key === column) {
            if (currentSortConfig.direction === "asc") {
                newDirection = "desc";
            } else if (currentSortConfig.direction === "desc") {
                newDirection = null;
            }
        }

        setSortConfig(newDirection ? { key: column, direction: newDirection } : null);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    // Format events for display
    const formattedEvents = useMemo(() => {
        return events.map(event => ({
            ...event,
            status: event.status.charAt(0).toUpperCase() + event.status.slice(1),
            date_declared: formatDate(event.date_declared),
            end_date: event.end_date ? formatDate(event.end_date) : "NA",
            capacity: event.capacity || 0,
            max_occupancy: event.max_occupancy || 0,
            usage_percentage: event.usage_percentage || 0,
        }));
    }, [events]);

    const totalPages = pagination?.total_pages || 1;

    const processedData = formattedEvents;
    const paginatedData = processedData;

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative">
            <ErrorAlert error={error} />

            {selectedCenter ? (
                <MapPanel
                    isPanelVisible={isPanelVisible}
                    setIsPanelVisible={setIsPanelVisible}
                    selectedCenter={selectedCenter}
                    isLoadingCenter={isLoadingCenter || isLoadingCenters}
                    getCenterStatusStyles={getCenterStatusStyles}
                    getUsageColor={getUsageColor}
                    centers={mapCenters.length > 0 ? mapCenters : evacuationCenters}
                    highlightCenterId={user?.center_id!}
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

            {/* UPDATED: Use new StatsRow with filters - WITH centerId for center admin */}
            <StatsRow centerId={user?.center_id ?? undefined} />

            <EventHistoryTable
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
                sortConfig={sortConfig}
                // Remove CRUD props for read-only table
            />

            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />
        </div>
    );
}