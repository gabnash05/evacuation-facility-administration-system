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
import { formatDate } from "@/utils/formatters";
import type { Event, EventDetails } from "@/types/event";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
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
    const [selectedCenter, setSelectedCenter] = useState<SelectedCenter>({
        name: "Bagong Silang Barangay Gym/Hall",
        address: "Hinaplanon",
        status: "active",
        capacity: 500,
        current_occupancy: 300,
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

    // Stats loading state
    const [isLoadingStats] = useState(false);
    const [isLoadingCenter] = useState(false);

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
            console.error("Create event error:", err);
            // Error is handled by the store
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

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

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

            <MapPanel
                isPanelVisible={isPanelVisible}
                setIsPanelVisible={setIsPanelVisible}
                selectedCenter={selectedCenter}
                isLoadingCenter={isLoadingCenter}
                getCenterStatusStyles={getCenterStatusStyles}
                getUsageColor={getUsageColor}
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
            />

            {/* Event Details Modal */}
            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />

            {/* Create Event Modal */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateEvent}
            />

            {/* Edit Event Modal */}
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

            {/* Delete Event Dialog */}
            <DeleteEventDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                eventName={deletingEvent?.event_name || ""}
                loading={deleteLoading}
            />

            {/* Global Success Toast */}
            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}