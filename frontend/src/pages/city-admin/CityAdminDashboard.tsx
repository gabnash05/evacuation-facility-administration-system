import { useState, useMemo, useEffect } from "react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { MapPanel } from "@/components/features/dashboard/MapPanel";
import { StatsRow } from "@/components/features/dashboard/StatsRow";
import { EventHistoryTable } from "@/components/features/dashboard/EventHistoryTable";
import { ErrorAlert } from "@/components/features/dashboard/ErrorAlert";
import { CreateEventModal } from "@/components/features/events/CreateEventModal";
import { DeleteEventDialog } from "@/components/features/events/DeleteEventDialog";
import { SuccessToast } from "@/components/features/evacuation-center/SuccessToast";
import { useEventStore } from "@/store/eventStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { formatDate } from "@/utils/formatters";
import type { Event, EventDetails } from "@/types/event";
import { useAuthStore } from "@/store/authStore";
import type { EvacuationCenter } from "@/types/center";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
    latitude?: number;
    longitude?: number;
}

export function CityAdminDashboard() {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successToast, setSuccessToast] = useState({ isOpen: false, message: "" });

    // Use evacuation center store instead of local state
    const { 
        centers: evacuationCenters, 
        mapCenters,
        loading: isLoadingCenters,
        citySummary,
        fetchAllCenters, 
        fetchCitySummary 
    } = useEvacuationCenterStore();

    // City-wide summary instead of single center
    const [selectedCenter, setSelectedCenter] = useState<SelectedCenter>({
        name: "Iligan City",
        address: "",
        status: "inactive",
        capacity: 0,
        current_occupancy: 0,
    });

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
        createEvent,
        updateEvent,
        deleteEvent,
    } = useEventStore();

    // Get current user and role
    const { user } = useAuthStore();
    const userRole = user?.role;

    // Stats loading state
    const [isLoadingStats] = useState(false);
    const [isLoadingCenter, setIsLoadingCenter] = useState(true);

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

    // Fetch city-wide summary on mount using the store
    useEffect(() => {
        const fetchCitySummaryData = async () => {
            try {
                setIsLoadingCenter(true);
                await fetchCitySummary();
                
                // Update selectedCenter with city summary data
                if (citySummary) {
                    setSelectedCenter({
                        name: "Iligan City",
                        address: "",
                        status: citySummary.status as "active" | "inactive" | "closed",
                        capacity: citySummary.total_capacity,
                        current_occupancy: citySummary.total_current_occupancy,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch city summary:", error);
            } finally {
                setIsLoadingCenter(false);
            }
        };

        fetchCitySummaryData();
    }, [fetchCitySummary]);

    // Update selectedCenter when citySummary changes
    useEffect(() => {
        if (citySummary) {
            setSelectedCenter({
                name: "Iligan City",
                address: "",
                status: citySummary.status as "active" | "inactive" | "closed",
                capacity: citySummary.total_capacity,
                current_occupancy: citySummary.total_current_occupancy,
            });
        }
    }, [citySummary]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, searchQuery, currentPage, entriesPerPage, sortConfig]);

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

    const handleAddEvent = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateEvent = async (eventData: any) => {
        try {
            await createEvent({
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                date_declared: eventData.date_declared,
                end_date: eventData.end_date,
                status: eventData.status,
                center_ids: eventData.center_ids,
            });

            setIsCreateModalOpen(false);
            setSuccessToast({ isOpen: true, message: "Event created successfully" });
        } catch (err: any) {
            throw err;
        }
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setIsEditModalOpen(true);
    };

    const handleUpdateEvent = async (eventData: any) => {
        if (!editingEvent) return;

        if (
            eventData.end_date &&
            new Date(eventData.end_date) < new Date(eventData.date_declared)
        ) {
            console.error("End date cannot be earlier than the date declared.");
            return;
        }

        try {
            await updateEvent(editingEvent.event_id, {
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                date_declared: eventData.date_declared,
                end_date: eventData.end_date,
                status: eventData.status,
                center_ids: eventData.center_ids,
            });

            setIsEditModalOpen(false);
            setEditingEvent(null);
            setSuccessToast({ isOpen: true, message: "Event updated successfully" });
        } catch (err: any) {
            console.error("Update event error:", err);
        }
    };

    const handleDeleteEvent = (event: Event) => {
        setDeletingEvent(event);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingEvent) return;

        setDeleteLoading(true);
        try {
            await deleteEvent(deletingEvent.event_id);
            setSuccessToast({ isOpen: true, message: "Event deleted successfully" });
            setIsDeleteDialogOpen(false);
            setDeletingEvent(null);
        } catch (err: any) {
            console.error("Delete event error:", err);
            setSuccessToast({ isOpen: true, message: "Failed to delete event" });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setDeletingEvent(null);
        setDeleteLoading(false);
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

        // Set the new sort config - this will trigger the useEffect to refetch
        setSortConfig(newDirection ? { key: column, direction: newDirection } : null);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const statsData = [
        { label: "Total Checked In", value: "300", max: "1000", percentage: 30 },
        { label: "Total Checked Out", value: "271", max: "500", percentage: 54 },
        { label: "Total Missing", value: "5", max: "", percentage: 0 },
        { label: "Total Unaccounted", value: "429", max: "1000", percentage: 43 },
    ];

    const formattedEvents = useMemo(() => {
        return events.map(event => ({
            ...event,
            status: event.status.charAt(0).toUpperCase() + event.status.slice(1),
            date_declared: formatDate(event.date_declared),
            end_date: event.end_date ? formatDate(event.end_date) : "NA",
            capacity: event.capacity || 0,
            max_occupancy: event.max_occupancy || 0,
            usage_percentage: event.overall_usage_percentage || 0,
        }));
    }, [events]);

    const totalPages = pagination?.total_pages || 1;

    const processedData = formattedEvents;
    const paginatedData = processedData;

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative">
            <ErrorAlert error={error} />

            <MapPanel
                isPanelVisible={isPanelVisible}
                setIsPanelVisible={setIsPanelVisible}
                selectedCenter={selectedCenter}
                isLoadingCenter={isLoadingCenter || isLoadingCenters}
                getCenterStatusStyles={getCenterStatusStyles}
                getUsageColor={getUsageColor}
                centers={mapCenters.length > 0 ? mapCenters : evacuationCenters} // Use mapCenters or centers from store
            />

            <StatsRow statsData={statsData} isLoadingStats={isLoadingStats} />

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
                onAddEvent={handleAddEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                userRole={userRole}
            />

            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateEvent}
            />

            {editingEvent && (
                <CreateEventModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingEvent(null);
                    }}
                    onSubmit={handleUpdateEvent}
                    initialData={editingEvent}
                />
            )}

            <DeleteEventDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                eventName={deletingEvent?.event_name || ""}
                loading={deleteLoading}
            />

            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}