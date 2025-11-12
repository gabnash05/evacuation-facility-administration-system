import { create } from "zustand";
import { EventService } from "@/services/eventService";
import type { Event, EventDetails } from "@/types/event";

interface EventState {
    events: Event[];
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
    fetchEvents: (centerId?: number) => Promise<void>;
    createEvent: (eventData: any) => Promise<void>;
    updateEvent: (id: number, eventData: any) => Promise<void>;
    deleteEvent: (id: number) => Promise<void>;
    getEventDetails: (id: number) => Promise<EventDetails>;
    resetState: () => void;
}

const initialState = {
    events: [],
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
            console.log("Fetching events with sorting:", {
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction,
                page: currentPage,
                limit: entriesPerPage,
                search: searchQuery,
            });
            
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

    createEvent: async (eventData: any) => {
        try {
            await EventService.createEvent(eventData);
            await get().fetchEvents(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create event");
        }
    },

    updateEvent: async (id: number, eventData: any) => {
        try {
            const updateData = {
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                date_declared: eventData.date_declared,
                end_date: eventData.end_date,
                status: eventData.status,
                center_ids: eventData.center_ids || [],
            };

            await EventService.updateEvent(id, updateData);
            await get().fetchEvents();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update event");
        }
    },

    deleteEvent: async (id: number) => {
        try {
            await EventService.deleteEvent(id);
            await get().fetchEvents();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete event");
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

    resetState: () => set(initialState),
}));