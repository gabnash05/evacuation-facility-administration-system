import { useState, useMemo, useEffect } from "react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { MapPanel } from "@/components/features/dashboard/MapPanel";
import { StatsRow } from "@/components/features/dashboard/StatsRow";
import { EventHistoryTable } from "@/components/features/dashboard/EventHistoryTable";
import { ErrorAlert } from "@/components/features/dashboard/ErrorAlert";
import { CreateEventModal } from "@/components/features/events/CreateEventModal";
import { ResolveEventModal } from "@/components/features/events/ResolveEventModal";
import { DeleteEventDialog } from "@/components/features/events/DeleteEventDialog";
import { SuccessToast } from "@/components/features/evacuation-center/SuccessToast";
import { useEventStore } from "@/store/eventStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { formatDate } from "@/utils/formatters";
import type { Event, EventDetails } from "@/types/event";
import { useAuthStore } from "@/store/authStore";

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
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [resolvingEvent, setResolvingEvent] = useState<Event | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successToast, setSuccessToast] = useState({ isOpen: false, message: "" });
    const [createError, setCreateError] = useState<string | null>(null);

    // Use evacuation center store
    const {
        centers: evacuationCenters,
        mapCenters,
        loading: isLoadingCenters,
        citySummary,
        fetchAllCenters,
        fetchCitySummary,
    } = useEvacuationCenterStore();

    // Use attendance store to validate attendance conditions
    const { validateAttendanceConditions } = useAttendanceStore();

    const { fetchActiveEvent } = useEventStore();

    // City-wide summary
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
        activeEvent,
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
        resolveEvent,
        deleteEvent,
        clearError,
        validateEventCreation,
    } = useEventStore();

    // Get current user and role
    const { user } = useAuthStore();
    const userRole = user?.role;

    // Center loading state
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
        // Fetch active event immediately on dashboard mount
        const initActiveEvent = async () => {
            try {
                await fetchActiveEvent();
            } catch (error) {
                console.error("Failed to fetch active event:", error);
            }
        };
        
        initActiveEvent();
    }, [fetchActiveEvent]);

    // Also add this for good measure in your existing events useEffect:
    useEffect(() => {
        fetchEvents();
        fetchActiveEvent(); // Add this line
    }, [fetchEvents, fetchActiveEvent, searchQuery, currentPage, entriesPerPage, sortConfig]);

    // Fetch events when dependencies change
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

    const handleAddEvent = async () => {
        try {
            const validation = await validateEventCreation();
            if (!validation.canCreate) {
                setCreateError(validation.message || "Cannot create a new event at this time");
                setTimeout(() => setCreateError(null), 5000);
                return;
            }
            
            setIsCreateModalOpen(true);
            setCreateError(null);
        } catch (error) {
            console.error("Failed to validate event creation:", error);
            setCreateError("Failed to validate event creation conditions");
            setTimeout(() => setCreateError(null), 5000);
        }
    };

    const handleCreateEvent = async (eventData: any) => {
        try {
            const result = await createEvent({
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                date_declared: eventData.date_declared,
                end_date: eventData.end_date,
                center_ids: eventData.center_ids,
            });

            if (result.success) {
                setIsCreateModalOpen(false);
                setSuccessToast({ isOpen: true, message: "Event created successfully" });
            } else {
                throw new Error(result.message || "Failed to create event");
            }
        } catch (err: any) {
            console.error("Create event error:", err);
            throw err;
        }
    };

    const handleEditEvent = async (event: Event) => {
        // Check if event can be edited (not resolved)
        if (event.status === 'resolved') {
            setCreateError("Cannot edit a resolved event");
            setTimeout(() => setCreateError(null), 5000);
            return;
        }
        
        setEditingEvent(event);
        setIsEditModalOpen(true);
    };

    const handleUpdateEvent = async (eventData: any) => {
        if (!editingEvent) return;

        if (
            eventData.end_date &&
            new Date(eventData.end_date) < new Date(eventData.date_declared)
        ) {
            throw new Error("End date cannot be earlier than the date declared.");
        }

        try {
            const result = await updateEvent(editingEvent.event_id, {
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                date_declared: eventData.date_declared,
                end_date: eventData.end_date,
                status: eventData.status,
                center_ids: eventData.center_ids,
            });

            if (result.success) {
                setIsEditModalOpen(false);
                setEditingEvent(null);
                setSuccessToast({ isOpen: true, message: "Event updated successfully" });
            } else {
                throw new Error(result.message || "Failed to update event");
            }
        } catch (err: any) {
            console.error("Update event error:", err);
            throw err;
        }
    };

    const handleResolveEvent = async (event: Event) => {
        // Check if event can be resolved (not already resolved)
        if (event.status === 'resolved') {
            setCreateError("Event is already resolved");
            setTimeout(() => setCreateError(null), 5000);
            return;
        }

        setResolvingEvent(event);
        setIsResolveModalOpen(true);
    };

    const handleConfirmResolve = async () => {
        if (!resolvingEvent) return;

        // Note: The actual resolve logic is handled in the ResolveEventModal component
        // This function just sets up the modal
    };

    const handleDeleteEvent = async (event: Event) => {
        // Check if event can be deleted (not resolved)
        if (event.status === 'resolved') {
            setCreateError("Cannot delete a resolved event");
            setTimeout(() => setCreateError(null), 5000);
            return;
        }
        
        setDeletingEvent(event);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingEvent) return;

        setDeleteLoading(true);
        try {
            const result = await deleteEvent(deletingEvent.event_id);
            
            if (result.success) {
                setSuccessToast({ isOpen: true, message: "Event deleted successfully" });
            } else {
                setSuccessToast({ isOpen: true, message: result.message || "Failed to delete event" });
            }
            
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

        setSortConfig(newDirection ? { key: column, direction: newDirection } : null);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setCreateError(null);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingEvent(null);
        setCreateError(null);
    };

    const handleResolveModalClose = () => {
        setIsResolveModalOpen(false);
        setResolvingEvent(null);
        setCreateError(null);
    };

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
        <div className="w-full min-w-0 bg-background flex flex-col relative px-6">
            <ErrorAlert error={error || createError} />

            <MapPanel
                isPanelVisible={isPanelVisible}
                setIsPanelVisible={setIsPanelVisible}
                selectedCenter={selectedCenter}
                isLoadingCenter={isLoadingCenter || isLoadingCenters}
                getCenterStatusStyles={getCenterStatusStyles}
                getUsageColor={getUsageColor}
                centers={mapCenters.length > 0 ? mapCenters : evacuationCenters}
            />

            <StatsRow />

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
                onResolve={handleResolveEvent}
                userRole={userRole}
                activeEvent={activeEvent}
            />

            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={handleCreateModalClose}
                onSubmit={handleCreateEvent}
            />

            {editingEvent && (
                <CreateEventModal
                    isOpen={isEditModalOpen}
                    onClose={handleEditModalClose}
                    onSubmit={handleUpdateEvent}
                    initialData={editingEvent}
                />
            )}

            {resolvingEvent && (
                <ResolveEventModal
                    isOpen={isResolveModalOpen}
                    onClose={handleResolveModalClose}
                    event={resolvingEvent}
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