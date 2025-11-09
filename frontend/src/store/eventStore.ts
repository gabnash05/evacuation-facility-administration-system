// store/eventStore.ts
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

    // Actions
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    fetchEvents: () => Promise<void>;
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

    fetchEvents: async () => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig } = get();

        set({ loading: true, error: null });

        try {
            const response = await EventService.getEvents({
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
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
            await EventService.updateEvent(id, eventData);
            await get().fetchEvents(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update event");
        }
    },

    deleteEvent: async (id: number) => {
        try {
            await EventService.deleteEvent(id);
            await get().fetchEvents(); // Refresh the list
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
