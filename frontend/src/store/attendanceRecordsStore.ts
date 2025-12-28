import { create } from "zustand";
import { AttendanceRecordsService } from "@/services/attendanceRecordsService";
import { EventService } from "@/services/eventService";
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
    TransferData,
} from "@/types/attendance";
import type { Event } from "@/types/event";

interface AttendanceState {
    // Records state
    attendanceRecords: AttendanceRecord[];
    currentAttendees: AttendanceRecord[];
    eventAttendance: AttendanceRecord[];
    transferRecords: AttendanceRecord[];
    centerOccupancy: {
        [centerId: number]: {
            current_occupancy: number;
            lastUpdated: string;
        };
    };

    // UI state
    loading: boolean;
    error: string | null;

    // Filter and pagination state for main attendance page
    searchQuery: string;
    currentPage: number;
    entriesPerPage: number;
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;

    // Filter state for main attendance page
    attendancePageFilters: {
        centerId: number | null;
        individualId: number | null;
        eventId: number | null;
        householdId: number | null;
        status: string | null;
        date: string | null;
    };

    // Filter state for modal/other contexts
    modalFilters: {
        centerId: number | null;
        individualId: number | null;
        eventId: number | null;
        householdId: number | null;
        status: string | null;
        date: string | null;
    };

    // Pagination
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        limit: number;
    } | null;

    // Summary state
    attendanceSummary: AttendanceSummary | null;

    // Active event state for attendance validation
    activeEvent: Event | null;
    canTakeAttendance: boolean;
    attendanceValidation: {
        centerId?: number;
        canTakeAttendance: boolean;
        message?: string;
        activeEvent?: Event;
        centerStatus?: string;
    } | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    
    // Separate filter actions for different contexts
    setAttendancePageFilters: (filters: {
        centerId?: number | null;
        individualId?: number | null;
        eventId?: number | null;
        householdId?: number | null;
        status?: string | null;
        date?: string | null;
    }) => void;
    
    setModalFilters: (filters: {
        centerId?: number | null;
        individualId?: number | null;
        eventId?: number | null;
        householdId?: number | null;
        status?: string | null;
        date?: string | null;
    }) => void;
    
    // Backward compatibility alias (uses attendance page filters)
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
    fetchCurrentCenterOccupancy: (centerId: number) => Promise<{
        success: boolean;
        current_occupancy?: number;
        message?: string;
    }>;
    getCachedCenterOccupancy: (centerId: number) => {
        current_occupancy: number | null;
        lastUpdated: string | null;
    };
    
    // Event-related actions
    fetchActiveEvent: () => Promise<void>;
    validateAttendanceConditions: (centerId: number) => Promise<{
        canTakeAttendance: boolean;
        message?: string;
        activeEvent?: Event;
        centerStatus?: string;
    }>;

    // CRUD actions with validation
    checkInIndividual: (data: CreateAttendanceData) => Promise<{
        success: boolean;
        data?: AttendanceRecord;
        message?: string;
    }>;
    checkInMultipleIndividuals: (data: CreateAttendanceData[]) => Promise<{
        success: boolean;
        data?: AttendanceRecord[];
        message?: string;
    }>;
    checkOutIndividual: (recordId: number, data?: CheckOutData) => Promise<{
        success: boolean;
        data?: AttendanceRecord;
        message?: string;
    }>;
    checkOutMultipleIndividuals: (data: Array<{
        record_id: number;
        check_out_time?: string;
        notes?: string;
    }>) => Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }>;
    transferIndividual: (recordId: number, data: TransferData) => Promise<{
        success: boolean;
        data?: AttendanceRecord;
        message?: string;
    }>;
    transferMultipleIndividuals: (data: {
        transfers: Array<{
            record_id: number;
            transfer_to_center_id: number;
            transfer_time?: string;
            recorded_by_user_id?: number;
            notes?: string;
        }>;
    }) => Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }>;
    deleteAttendanceRecord: (recordId: number) => Promise<{
        success: boolean;
        message?: string;
    }>;

    // Utility actions
    recalculateCenterOccupancy: (centerId: number) => Promise<void>;
    recalculateAllCenterOccupancies: () => Promise<void>;
    getCurrentEventAttendance: () => Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }>;
    
    resetState: () => void;
    resetAttendancePageFilters: () => void;
    resetModalFilters: () => void;
    clearError: () => void;
}

const initialState = {
    attendanceRecords: [],
    currentAttendees: [],
    eventAttendance: [],
    transferRecords: [],
    centerOccupancy: {},
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    attendancePageFilters: {
        centerId: null,
        individualId: null,
        eventId: null,
        householdId: null,
        status: null,
        date: null,
    },
    modalFilters: {
        centerId: null,
        individualId: null,
        eventId: null,
        householdId: null,
        status: null,
        date: null,
    },
    pagination: null,
    attendanceSummary: null,
    activeEvent: null,
    canTakeAttendance: false,
    attendanceValidation: null,
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

    setSortConfig: config => {
        set({ sortConfig: config, currentPage: 1 });
    },

    setAttendancePageFilters: filters => {
        set(state => ({
            attendancePageFilters: { ...state.attendancePageFilters, ...filters },
            currentPage: 1,
        }));
    },

    setModalFilters: filters => {
        set(state => ({
            modalFilters: { ...state.modalFilters, ...filters },
        }));
    },

    // Backward compatibility - maps to attendance page filters
    setFilters: filters => {
        set(state => ({
            attendancePageFilters: { ...state.attendancePageFilters, ...filters },
            currentPage: 1,
        }));
    },

    fetchAttendanceRecords: async (params: GetAttendanceParams = {}) => {
        const {
            searchQuery,
            currentPage,
            entriesPerPage,
            sortConfig,
            attendancePageFilters,
        } = get();

        set({ loading: true, error: null });

        try {
            const response: AttendanceRecordsResponse =
                await AttendanceRecordsService.getAttendanceRecords({
                    ...params,
                    search: searchQuery,
                    page: currentPage,
                    limit: entriesPerPage,
                    sortBy: sortConfig?.key,
                    sortOrder: sortConfig?.direction || undefined,
                    center_id: attendancePageFilters.centerId || undefined,
                    individual_id: attendancePageFilters.individualId || undefined,
                    event_id: attendancePageFilters.eventId || undefined,
                    household_id: attendancePageFilters.householdId || undefined,
                    status: (attendancePageFilters.status as any) || undefined,
                    date: attendancePageFilters.date || undefined,
                });

            set({
                attendanceRecords: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error:
                    error instanceof Error ? error.message : "Failed to fetch attendance records",
                loading: false,
                attendanceRecords: [],
                pagination: null,
            });
        }
    },

    fetchCurrentAttendees: async (params: GetCurrentAttendeesParams = {}) => {
        const { currentPage, entriesPerPage, attendancePageFilters } = get();

        set({ loading: true, error: null });

        try {
            const response: CurrentAttendeesResponse =
                await AttendanceRecordsService.getCurrentAttendees({
                    ...params,
                    page: currentPage,
                    limit: entriesPerPage,
                    center_id: attendancePageFilters.centerId || undefined,
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
        const { currentPage, entriesPerPage, attendancePageFilters } = get();

        set({ loading: true, error: null });

        try {
            const response: EventAttendanceResponse =
                await AttendanceRecordsService.getEventAttendance(eventId, {
                    ...params,
                    page: currentPage,
                    limit: entriesPerPage,
                    center_id: attendancePageFilters.centerId || undefined,
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
        const { currentPage, entriesPerPage, attendancePageFilters } = get();

        set({ loading: true, error: null });

        try {
            const response: TransferRecordsResponse =
                await AttendanceRecordsService.getTransferRecords({
                    ...params,
                    page: currentPage,
                    limit: entriesPerPage,
                    center_id: attendancePageFilters.centerId || undefined,
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
                error:
                    error instanceof Error ? error.message : "Failed to fetch attendance summary",
                loading: false,
                attendanceSummary: null,
            });
        }
    },

    fetchIndividualAttendanceHistory: async (individualId: number): Promise<AttendanceRecord[]> => {
        set({ loading: true, error: null });

        try {
            const response =
                await AttendanceRecordsService.getIndividualAttendanceHistory(individualId);
            set({ loading: false });
            return response.data ?? [];
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch individual attendance history";
            set({
                error: errorMessage,
                loading: false,
            });
            throw new Error(errorMessage);
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

    validateAttendanceConditions: async (centerId: number) => {
        set({ loading: true, error: null });

        try {
            const validation = await AttendanceRecordsService.canTakeAttendance(centerId);
            
            set({
                attendanceValidation: {
                    centerId,
                    ...validation
                },
                canTakeAttendance: validation.canTakeAttendance,
                loading: false,
            });

            return validation;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to validate attendance conditions";
            set({
                error: errorMessage,
                loading: false,
                attendanceValidation: {
                    centerId,
                    canTakeAttendance: false,
                    message: errorMessage
                },
                canTakeAttendance: false,
            });
            return {
                canTakeAttendance: false,
                message: errorMessage
            };
        }
    },

    checkInIndividual: async (data: CreateAttendanceData) => {
        set({ loading: true, error: null });

        try {
            // Validate attendance conditions
            const validation = await get().validateAttendanceConditions(data.center_id);
            if (!validation.canTakeAttendance) {
                throw new Error(validation.message || "Cannot take attendance at this center");
            }

            const response = await AttendanceRecordsService.checkInIndividual(data);

            // Refresh relevant data based on current view
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to check in individual";
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

    checkInMultipleIndividuals: async (data: CreateAttendanceData[]) => {
        set({ loading: true, error: null });

        try {
            if (data.length === 0) {
                throw new Error("No individuals provided for check-in");
            }

            // Validate attendance conditions for the center
            const centerId = data[0].center_id;
            const validation = await get().validateAttendanceConditions(centerId);
            if (!validation.canTakeAttendance) {
                throw new Error(validation.message || "Cannot take attendance at this center");
            }

            const response = await AttendanceRecordsService.checkInMultipleIndividuals(data);

            // Refresh relevant data based on current view
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to check in individuals";
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

    checkOutIndividual: async (recordId: number, data: CheckOutData = {}) => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.checkOutIndividual(recordId, data);

            // Refresh relevant data
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }
            await get().fetchAttendanceRecords();

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to check out individual";
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

    checkOutMultipleIndividuals: async (data) => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.checkOutMultipleIndividuals(data);

            // Refresh relevant data
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }
            await get().fetchAttendanceRecords();

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to check out individuals";
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

    transferIndividual: async (recordId: number, data: TransferData) => {
        set({ loading: true, error: null });

        try {
            // Validate destination center conditions
            const validation = await get().validateAttendanceConditions(data.transfer_to_center_id);
            if (!validation.canTakeAttendance) {
                throw new Error(validation.message || "Cannot transfer to this center");
            }

            const response = await AttendanceRecordsService.transferIndividual(recordId, data);

            // Refresh relevant data
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }
            await get().fetchTransferRecords();
            await get().fetchAttendanceRecords();

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to transfer individual";
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

    transferMultipleIndividuals: async (data) => {
        set({ loading: true, error: null });

        try {
            // Validate all destination centers
            for (const transfer of data.transfers) {
                const validation = await get().validateAttendanceConditions(transfer.transfer_to_center_id);
                if (!validation.canTakeAttendance) {
                    throw new Error(`Cannot transfer to center ${transfer.transfer_to_center_id}: ${validation.message}`);
                }
            }

            const response = await AttendanceRecordsService.transferMultipleIndividuals(data);

            // Refresh relevant data
            const state = get();
            if (state.attendancePageFilters.centerId) {
                await get().fetchCurrentAttendees();
                await get().fetchAttendanceSummary(state.attendancePageFilters.centerId);
            }
            await get().fetchTransferRecords();
            await get().fetchAttendanceRecords();

            set({ loading: false });
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to transfer individuals";
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

    deleteAttendanceRecord: async (recordId: number) => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.deleteAttendanceRecord(recordId);

            // Get current state to check pagination
            const { attendanceRecords, currentPage } = get();

            // If this was the last item on the current page and we're not on page 1
            if (attendanceRecords.length === 1 && currentPage > 1) {
                // Decrement the page before fetching
                set({ currentPage: currentPage - 1 });
            }

            await get().fetchAttendanceRecords(); // Refresh the list

            set({ loading: false });
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete attendance record";
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

    fetchCurrentCenterOccupancy: async (centerId: number) => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.getCurrentCenterOccupancy(centerId);
            
            if (response.success && response.data) {
                // Update the cache
                set(state => ({
                    centerOccupancy: {
                        ...state.centerOccupancy,
                        [centerId]: {
                            current_occupancy: response.data.current_occupancy,
                            lastUpdated: new Date().toISOString(),
                        }
                    },
                    loading: false,
                }));
                
                return {
                    success: true,
                    current_occupancy: response.data.current_occupancy,
                    message: response.message,
                };
            } else {
                throw new Error(response.message || "Failed to fetch occupancy");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch center occupancy";
            set({
                error: errorMessage,
                loading: false,
            });
            return {
                success: false,
                message: errorMessage,
            };
        }
    },

    getCachedCenterOccupancy: (centerId: number) => {
        const state = get();
        const occupancy = state.centerOccupancy[centerId];
        
        return {
            current_occupancy: occupancy?.current_occupancy || null,
            lastUpdated: occupancy?.lastUpdated || null,
        };
    },

    recalculateCenterOccupancy: async (centerId: number) => {
        try {
            await AttendanceRecordsService.recalculateCenterOccupancy(centerId);

            // Refresh current attendees and summary for the center
            await get().fetchCurrentAttendees({ center_id: centerId });
            await get().fetchAttendanceSummary(centerId);
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to recalculate occupancy"
            );
        }
    },

    recalculateAllCenterOccupancies: async () => {
        try {
            await AttendanceRecordsService.recalculateAllCenterOccupancies();

            // Refresh all current attendees
            await get().fetchCurrentAttendees();
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : "Failed to recalculate all occupancies"
            );
        }
    },

    getCurrentEventAttendance: async () => {
        set({ loading: true, error: null });

        try {
            const response = await AttendanceRecordsService.getCurrentEventAttendance();

            set({ loading: false });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to get current event attendance";
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

    resetAttendancePageFilters: () => {
        set(state => ({
            attendancePageFilters: {
                centerId: null,
                individualId: null,
                eventId: null,
                householdId: null,
                status: null,
                date: null,
            },
            currentPage: 1,
        }));
    },

    resetModalFilters: () => {
        set({
            modalFilters: {
                centerId: null,
                individualId: null,
                eventId: null,
                householdId: null,
                status: null,
                date: null,
            },
        });
    },

    clearError: () => {
        set({ error: null });
    },

    resetState: () => set(initialState),
}));