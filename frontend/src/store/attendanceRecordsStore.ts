import { create } from "zustand";
import { AttendanceRecordsService } from "@/services/attendanceRecordsService";
import type { 
    AttendanceRecord, 
    AttendanceRecordsResponse,
    CurrentAttendeesResponse,
    EventAttendanceResponse,
    TransferRecordsResponse,
    AttendanceSummary,
    GetAttendanceParams,
    GetCurrentAttendeesParams,
    GetEventAttendanceParams,
    GetTransferRecordsParams,
    CreateAttendanceData,
    CheckOutData,
    TransferData
} from "@/types/attendance";

interface AttendanceState {
    // Records state
    attendanceRecords: AttendanceRecord[];
    currentAttendees: AttendanceRecord[];
    eventAttendance: AttendanceRecord[];
    transferRecords: AttendanceRecord[];
    
    // UI state
    loading: boolean;
    error: string | null;
    
    // Filter and pagination state
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    
    // Filter state
    centerId: number | null;
    individualId: number | null;
    eventId: number | null;
    householdId: number | null;
    status: string | null;
    date: string | null;
    
    // Pagination
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;

    // Summary state
    attendanceSummary: AttendanceSummary | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    setFilters: (filters: {
        centerId?: number | null;
        individualId?: number | null;
        eventId?: number | null;
        householdId?: number | null;
        status?: string | null;
        date?: string | null;
    }) => void;
    
    // Data fetching actions
    fetchAttendanceRecords: (params?: GetAttendanceParams) => Promise<void>;
    fetchCurrentAttendees: (params?: GetCurrentAttendeesParams) => Promise<void>;
    fetchEventAttendance: (eventId: number, params?: GetEventAttendanceParams) => Promise<void>;
    fetchTransferRecords: (params?: GetTransferRecordsParams) => Promise<void>;
    fetchAttendanceSummary: (centerId: number, eventId?: number) => Promise<void>;
    fetchIndividualAttendanceHistory: (individualId: number) => Promise<AttendanceRecord[]>;
    
    // CRUD actions
    checkInIndividual: (data: CreateAttendanceData) => Promise<void>;
    checkOutIndividual: (recordId: number, data?: CheckOutData) => Promise<void>;
    transferIndividual: (recordId: number, data: TransferData) => Promise<void>;
    deleteAttendanceRecord: (recordId: number) => Promise<void>;
    
    // Utility actions
    recalculateCenterOccupancy: (centerId: number) => Promise<void>;
    recalculateAllCenterOccupancies: () => Promise<void>;
    resetState: () => void;
    clearError: () => void;
}

const initialState = {
    attendanceRecords: [],
    currentAttendees: [],
    eventAttendance: [],
    transferRecords: [],
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    centerId: null,
    individualId: null,
    eventId: null,
    householdId: null,
    status: null,
    date: null,
    pagination: null,
    attendanceSummary: null,
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
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

    setSortConfig: (config) => {
        set({ sortConfig: config, currentPage: 1 });
    },

    setFilters: (filters) => {
        set({ 
            ...filters, 
            currentPage: 1 
        });
    },

    fetchAttendanceRecords: async (params: GetAttendanceParams = {}) => {
        const { 
            searchQuery, 
            currentPage, 
            entriesPerPage, 
            sortConfig,
            centerId,
            individualId,
            eventId,
            householdId,
            status,
            date
        } = get();

        set({ loading: true, error: null });

        try {
            const response: AttendanceRecordsResponse = await AttendanceRecordsService.getAttendanceRecords({
                ...params,
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
                center_id: centerId || undefined,
                individual_id: individualId || undefined,
                event_id: eventId || undefined,
                household_id: householdId || undefined,
                status: status as any || undefined,
                date: date || undefined,
            });

            set({
                attendanceRecords: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch attendance records",
                loading: false,
                attendanceRecords: [],
                pagination: null,
            });
        }
    },

    fetchCurrentAttendees: async (params: GetCurrentAttendeesParams = {}) => {
        const { 
            currentPage, 
            entriesPerPage,
            centerId 
        } = get();

        set({ loading: true, error: null });

        try {
            const response: CurrentAttendeesResponse = await AttendanceRecordsService.getCurrentAttendees({
                ...params,
                page: currentPage,
                limit: entriesPerPage,
                center_id: centerId || undefined,
            });

            set({
                currentAttendees: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch current attendees",
                loading: false,
                currentAttendees: [],
                pagination: null,
            });
        }
    },

    fetchEventAttendance: async (eventId: number, params: GetEventAttendanceParams = {}) => {
        const { 
            currentPage, 
            entriesPerPage,
            centerId 
        } = get();

        set({ loading: true, error: null });

        try {
            const response: EventAttendanceResponse = await AttendanceRecordsService.getEventAttendance(eventId, {
                ...params,
                page: currentPage,
                limit: entriesPerPage,
                center_id: centerId || undefined,
            });

            set({
                eventAttendance: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch event attendance",
                loading: false,
                eventAttendance: [],
                pagination: null,
            });
        }
    },

    fetchTransferRecords: async (params: GetTransferRecordsParams = {}) => {
        const { 
            currentPage, 
            entriesPerPage,
            centerId 
        } = get();

        set({ loading: true, error: null });

        try {
            const response: TransferRecordsResponse = await AttendanceRecordsService.getTransferRecords({
                ...params,
                page: currentPage,
                limit: entriesPerPage,
                center_id: centerId || undefined,
            });

            set({
                transferRecords: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch transfer records",
                loading: false,
                transferRecords: [],
                pagination: null,
            });
        }
    },

    fetchAttendanceSummary: async (centerId: number, eventId?: number) => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.getAttendanceSummary(centerId, eventId);
            
            set({
                attendanceSummary: response.data,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch attendance summary",
                loading: false,
                attendanceSummary: null,
            });
        }
    },

    fetchIndividualAttendanceHistory: async (individualId: number): Promise<AttendanceRecord[]> => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.getIndividualAttendanceHistory(individualId);
            set({ loading: false });
            return response.data ?? [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch individual attendance history";
            set({ 
                error: errorMessage, 
                loading: false 
            });
            throw new Error(errorMessage);
        }
    },

    checkInIndividual: async (data: CreateAttendanceData) => {
        try {
            await AttendanceRecordsService.checkInIndividual(data);
            
            // Refresh relevant data based on current view
            const state = get();
            if (state.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.centerId);
            }
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to check in individual");
        }
    },

    checkOutIndividual: async (recordId: number, data: CheckOutData = {}) => {
        try {
            await AttendanceRecordsService.checkOutIndividual(recordId, data);
            
            // Refresh relevant data
            const state = get();
            if (state.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.centerId);
            }
            await get().fetchAttendanceRecords();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to check out individual");
        }
    },

    transferIndividual: async (recordId: number, data: TransferData) => {
        try {
            await AttendanceRecordsService.transferIndividual(recordId, data);
            
            // Refresh relevant data
            const state = get();
            if (state.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.centerId);
            }
            await get().fetchTransferRecords();
            await get().fetchAttendanceRecords();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to transfer individual");
        }
    },

    deleteAttendanceRecord: async (recordId: number) => {
        try {
            await AttendanceRecordsService.deleteAttendanceRecord(recordId);

            // Get current state to check pagination
            const { attendanceRecords, currentPage } = get();

            // If this was the last item on the current page and we're not on page 1
            if (attendanceRecords.length === 1 && currentPage > 1) {
                // Decrement the page before fetching
                set({ currentPage: currentPage - 1 });
            }

            await get().fetchAttendanceRecords(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete attendance record");
        }
    },

    recalculateCenterOccupancy: async (centerId: number) => {
        try {
            await AttendanceRecordsService.recalculateCenterOccupancy(centerId);
            
            // Refresh current attendees and summary for the center
            await get().fetchCurrentAttendees({ center_id: centerId });
            await get().fetchAttendanceSummary(centerId);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to recalculate occupancy");
        }
    },

    recalculateAllCenterOccupancies: async () => {
        try {
            await AttendanceRecordsService.recalculateAllCenterOccupancies();
            
            // Refresh all current attendees
            await get().fetchCurrentAttendees();
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to recalculate all occupancies");
        }
    },

    clearError: () => {
        set({ error: null });
    },

    resetState: () => set(initialState),
}));