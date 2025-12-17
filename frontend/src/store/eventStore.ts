import { create } from "zustand";
import { EventService } from "@/services/eventService";
import type { Event, EventDetails } from "@/types/event";

interface EventState {
    events: Event[];
    activeEvent: Event | null;
    loading: boolean;
    error: string | null;
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;
    centerId: number | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    setCenterId: (centerId: number | null) => void;
    
    // Data fetching
    fetchEvents: (centerId?: number) => Promise<void>;
    fetchActiveEvent: () => Promise<void>;
    getEventDetails: (id: number) => Promise<EventDetails>;
    
    // CRUD operations with validation
    createEvent: (eventData: any) => Promise<{ success: boolean; data?: Event; message?: string }>;
    updateEvent: (id: number, eventData: any) => Promise<{ success: boolean; data?: Event; message?: string }>;
    resolveEvent: (id: number, end_date: string) => Promise<{ success: boolean; data?: Event; message?: string }>;
    deleteEvent: (id: number) => Promise<{ success: boolean; message?: string }>;
    
    // Validation helpers
    validateEventCreation: () => Promise<{ canCreate: boolean; message?: string; activeEvent?: Event }>;
    validateEventUpdate: (id: number) => Promise<{ canUpdate: boolean; message?: string; event?: Event }>;
    
    // Utility
    resetState: () => void;
    clearError: () => void;
}

const initialState = {
    events: [],
    activeEvent: null,
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    pagination: null,
    centerId: null,
};

export const useEventStore = create<EventState>((set, get) => ({
    ...initialState,

    setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
    },

    setCurrentPage: (page: number) => {
        set({ currentPage: page });
    },

    setEntriesPerPage: (entries: number) => {
        set({ entriesPerPage: entries, currentPage: 1 });
    },

    setSortConfig: config => {
        set({ sortConfig: config, currentPage: 1 });
    },

    setCenterId: (centerId: number | null) => {
        set({ centerId, currentPage: 1 });
    },

    fetchEvents: async (overrideCenterId?: number) => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig, centerId } = get();

        // Use overrideCenterId if provided, otherwise use stored centerId
        const filterCenterId = overrideCenterId !== undefined ? overrideCenterId : centerId;

        set({ loading: true, error: null });

        try {
            const response = await EventService.getEvents({
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
                center_id: filterCenterId || undefined,
            });

            set({
                events: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch events",
                loading: false,
                events: [],
                pagination: null,
            });
        }
    },

    fetchActiveEvent: async () => {
        set({ loading: true, error: null });

        try {
            const response = await EventService.getActiveEvent();
            
            set({
                activeEvent: response.data,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch active event",
                loading: false,
                activeEvent: null,
            });
        }
    },

    validateEventCreation: async (): Promise<{ canCreate: boolean; message?: string; activeEvent?: Event }> => {
        try {
            return await EventService.validateEventCreation();
        } catch (error) {
            return {
                canCreate: false,
                message: error instanceof Error ? error.message : "Failed to validate event creation"
            };
        }
    },

    validateEventUpdate: async (id: number): Promise<{ canUpdate: boolean; message?: string; event?: Event }> => {
        try {
            return await EventService.validateEventUpdate(id);
        } catch (error) {
            return {
                canUpdate: false,
                message: error instanceof Error ? error.message : "Failed to validate event update"
            };
        }
    },

    createEvent: async (eventData: any): Promise<{ success: boolean; data?: Event; message?: string }> => {
        set({ loading: true, error: null });

        try {
            // Validate if event can be created (no active event should exist)
            const validation = await get().validateEventCreation();
            if (!validation.canCreate) {
                throw new Error(validation.message || "Cannot create event");
            }

            // Always set status to 'active' for new events
            const newEventData = {
                ...eventData,
                status: 'active'
            };

            const response = await EventService.createEvent(newEventData);
            
            // Refresh events list and active event
            await get().fetchEvents();
            await get().fetchActiveEvent();

            set({ loading: false });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create event";
            set({
                error: errorMessage,
                loading: false,
            });
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    updateEvent: async (id: number, eventData: any): Promise<{ success: boolean; data?: Event; message?: string }> => {
        set({ loading: true, error: null });

        try {
            // Validate if event can be updated (should not be resolved)
            const validation = await get().validateEventUpdate(id);
            if (!validation.canUpdate) {
                throw new Error(validation.message || "Cannot update event");
            }

            // Prevent changing status to resolved via regular update
            if (eventData.status === 'resolved') {
                throw new Error("Use resolveEvent() method to resolve an event");
            }

            const response = await EventService.updateEvent(id, eventData);
            
            // Refresh events list
            await get().fetchEvents();
            
            // If this is the active event, refresh it too
            if (get().activeEvent?.event_id === id) {
                await get().fetchActiveEvent();
            }

            set({ loading: false });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update event";
            set({
                error: errorMessage,
                loading: false,
            });
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    resolveEvent: async (id: number, end_date: string): Promise<{ success: boolean; data?: Event; message?: string }> => {
        set({ loading: true, error: null });

        try {
            // Check if event can be resolved (should be active or monitoring)
            const validation = await get().validateEventUpdate(id);
            if (!validation.canUpdate) {
                throw new Error(validation.message || "Cannot resolve event");
            }

            const response = await EventService.resolveEvent(id, end_date);
            
            // Refresh events list and active event
            await get().fetchEvents();
            await get().fetchActiveEvent();

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to resolve event";
            set({
                error: errorMessage,
                loading: false,
            });
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    deleteEvent: async (id: number): Promise<{ success: boolean; message?: string }> => {
        set({ loading: true, error: null });

        try {
            // Check if event is resolved before deleting
            const validation = await get().validateEventUpdate(id);
            if (!validation.canUpdate && validation.event?.status === 'resolved') {
                throw new Error("Cannot delete a resolved event");
            }

            const response = await EventService.deleteEvent(id);
            
            // Refresh events list and active event
            await get().fetchEvents();
            await get().fetchActiveEvent();

            set({ loading: false });
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete event";
            set({
                error: errorMessage,
                loading: false,
            });
            return {
                success: false,
                message: errorMessage
            };
        }
    },

    getEventDetails: async (id: number): Promise<EventDetails> => {
        try {
            const response = await EventService.getEventDetails(id);
            return response.data;
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to fetch event details"
            );
        }
    },

    clearError: () => {
        set({ error: null });
    },

    resetState: () => set(initialState),
}));