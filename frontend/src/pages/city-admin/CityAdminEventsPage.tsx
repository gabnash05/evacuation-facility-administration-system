// pages/events/CityAdminEventsPage.tsx

import { useEffect, useMemo, useState } from "react";
import { TableToolbar } from "@/components/common/Toolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { EventsTable } from "@/components/features/events/EventsTable";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { CreateEventModal } from "@/components/features/events/CreateEventModal";
import { SuccessToast } from "@/components/features/evacuation-center/SuccessToast";
import { DeleteEventDialog } from "@/components/features/events/DeleteEventDialog";
import { useEventStore } from "@/store/eventStore";
import { debounce } from "@/utils/helpers";
import type { EventDetails, Event } from "@/types/event";

export function CityAdminEventsPage() {
    const {
        events,
        loading,
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
        createEvent,
        updateEvent,
        deleteEvent,
        getEventDetails,
    } = useEventStore();

    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [successToast, setSuccessToast] = useState({ isOpen: false, message: "" });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const debouncedFetchEvents = useMemo(() => debounce(() => fetchEvents(), 500), [fetchEvents]);

    useEffect(() => {
        if (searchQuery || entriesPerPage !== 10) {
            debouncedFetchEvents();
        } else {
            fetchEvents();
        }
    }, [searchQuery, currentPage, entriesPerPage, sortConfig, fetchEvents, debouncedFetchEvents]);

    const handleSort = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            setSortConfig({ key, direction: "asc" });
            return;
        }

        switch (sortConfig.direction) {
            case "asc":
                setSortConfig({ key, direction: "desc" });
                break;
            case "desc":
                setSortConfig({ key, direction: null });
                break;
            case null:
            default:
                setSortConfig({ key, direction: "asc" });
                break;
        }
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

        if (eventData.end_date && new Date(eventData.end_date) < new Date(eventData.date_declared)) {
            // Handle client-side validation error
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
                center_ids: eventData.center_ids
            });

            setIsEditModalOpen(false);
            setEditingEvent(null);
            setSuccessToast({ isOpen: true, message: "Event updated successfully" });
        } catch (err: any) {
            console.error("Update event error:", err);
            // Error is handled by the store
        }
    };

    const handleDeleteEvent = async (event: Event) => {
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
            setIsDetailsModalOpen(true);
        } catch (err: any) {
            console.error("Event details error:", err);
        }
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">Manage events and their information</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}

                {/* Main Table Card */}
                <div className="border border-border rounded-lg">
                    {/* Card Header */}
                    <div className="bg-card border-b border-border p-4">
                        <h3 className="font-semibold text-base text-foreground">Event List</h3>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-card border-b border-border p-4">
                        <TableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onAddItem={handleAddEvent}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            addButtonText="Add Event"
                        />
                    </div>

                    {/* Table Section */}
                    <div className="border-b border-border">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">Loading events...</div>
                            </div>
                        ) : (
                            <div>
                                <EventsTable
                                    data={events}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    loading={loading}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    onRowClick={handleRowClick}
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination Section */}
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={pagination?.total_items || 0}
                            onPageChange={handlePageChange}
                            loading={loading}
                            entriesLabel="events"
                        />
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedEvent(null);
                }}
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
