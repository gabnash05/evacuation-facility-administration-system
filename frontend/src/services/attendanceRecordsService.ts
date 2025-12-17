import { api, handleApiError } from "./api";
import type {
    AttendanceRecord,
    AttendanceRecordsResponse,
    CurrentAttendeesResponse,
    EventAttendanceResponse,
    TransferRecordsResponse,
    AttendanceSummaryResponse,
    IndividualAttendanceHistoryResponse,
    OccupancyRecalculationResponse,
    AllOccupanciesRecalculationResponse,
    GetAttendanceParams,
    GetCurrentAttendeesParams,
    GetEventAttendanceParams,
    GetTransferRecordsParams,
    CreateAttendanceData,
    CheckOutData,
    TransferData,
} from "@/types/attendance";

export class AttendanceRecordsService {
    static async getAttendanceRecords(
        params: GetAttendanceParams = {}
    ): Promise<AttendanceRecordsResponse> {
        try {
            const response = await api.get<AttendanceRecordsResponse>("/attendance", {
                params,
                withCredentials: true,
            });

            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getCurrentAttendees(
        params: GetCurrentAttendeesParams = {}
    ): Promise<CurrentAttendeesResponse> {
        try {
            const response = await api.get<CurrentAttendeesResponse>("/attendance/current", {
                params,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getEventAttendance(
        eventId: number,
        params: GetEventAttendanceParams = {}
    ): Promise<EventAttendanceResponse> {
        try {
            const response = await api.get<EventAttendanceResponse>(
                `/attendance/event/${eventId}`,
                {
                    params,
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getTransferRecords(
        params: GetTransferRecordsParams = {}
    ): Promise<TransferRecordsResponse> {
        try {
            const response = await api.get<TransferRecordsResponse>("/attendance/transfers", {
                params,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async checkInIndividual(data: CreateAttendanceData): Promise<{
        success: boolean;
        data: AttendanceRecord;
        message: string;
    }> {
        try {
            // Validate attendance conditions before checking in
            await this.validateAttendanceConditions(data.center_id);
            
            // Get active event for the center
            const activeEvent = await this.getActiveEventForCenter(data.center_id);
            
            // Automatically link to the active event
            const checkInData = {
                ...data,
                event_id: activeEvent.event_id
            };
            
            const response = await api.post<{
                success: boolean;
                data: AttendanceRecord;
                message: string;
            }>("/attendance/check-in", checkInData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async checkInMultipleIndividuals(data: CreateAttendanceData[]): Promise<{
        success: boolean;
        data: AttendanceRecord[];
        message: string;
    }> {
        try {
            if (data.length === 0) {
                throw new Error("No individuals provided for check-in");
            }

            // All check-ins should be for the same center in batch operations
            const centerId = data[0].center_id;
            
            // Validate attendance conditions before checking in
            await this.validateAttendanceConditions(centerId);
            
            // Get active event for the center
            const activeEvent = await this.getActiveEventForCenter(centerId);
            
            // Automatically link all to the active event
            const checkInData = data.map(item => ({
                ...item,
                event_id: activeEvent.event_id
            }));
            
            const response = await api.post<{
                success: boolean;
                data: AttendanceRecord[];
                message: string;
            }>("/attendance/check-in/batch", checkInData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async checkOutIndividual(
        recordId: number,
        data: CheckOutData = {}
    ): Promise<{
        success: boolean;
        data: AttendanceRecord;
        message: string;
    }> {
        try {
            // Check if the attendance record's center is still active
            const recordResponse = await this.getAttendanceRecord(recordId);
            const record = recordResponse.data;
            
            // Check center status
            const centerStatus = await this.getCenterStatus(record.center_id);
            if (centerStatus.status !== 'active') {
                throw new Error("Cannot check out from an inactive center. The associated event may be resolved.");
            }
            
            const response = await api.put<{
                success: boolean;
                data: AttendanceRecord;
                message: string;
            }>(`/attendance/${recordId}/check-out`, data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async checkOutMultipleIndividuals(data: Array<{
        record_id: number;
        check_out_time?: string;
        notes?: string;
    }>): Promise<{
        success: boolean;
        data: {
            successful_checkouts: Array<{
                record_id: number;
                individual_id: number;
                original_record_id: number;
            }>;
            failed_checkouts: Array<{
                index: number;
                record_id: number;
                error: string;
            }>;
        };
        message: string;
    }> {
        try {
            // Validate each record before batch operation
            for (const item of data) {
                const recordResponse = await this.getAttendanceRecord(item.record_id);
                const record = recordResponse.data;
                
                // Check center status
                const centerStatus = await this.getCenterStatus(record.center_id);
                if (centerStatus.status !== 'active') {
                    throw new Error(`Cannot check out from center ${record.center_id}. Center is inactive.`);
                }
            }
            
            const response = await api.post<{
                success: boolean;
                data: {
                    successful_checkouts: Array<{
                        record_id: number;
                        individual_id: number;
                        original_record_id: number;
                    }>;
                    failed_checkouts: Array<{
                        index: number;
                        record_id: number;
                        error: string;
                    }>;
                };
                message: string;
            }>("/attendance/check-out/batch", data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async transferIndividual(
        recordId: number,
        data: TransferData
    ): Promise<{
        success: boolean;
        data: AttendanceRecord;
        message: string;
    }> {
        try {
            // Validate destination center conditions
            await this.validateAttendanceConditions(data.transfer_to_center_id);
            
            // Get active event for destination center
            const activeEvent = await this.getActiveEventForCenter(data.transfer_to_center_id);
            
            // Automatically link transfer to the active event
            const transferData = {
                ...data,
                event_id: activeEvent.event_id
            };
            
            const response = await api.put<{
                success: boolean;
                data: AttendanceRecord;
                message: string;
            }>(`/attendance/${recordId}/transfer`, transferData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async transferMultipleIndividuals(data: {
        transfers: Array<{
            record_id: number;
            transfer_to_center_id: number;
            transfer_time?: string;
            recorded_by_user_id?: number;
            notes?: string;
        }>;
    }): Promise<{
        success: boolean;
        data: {
            successful_transfers: AttendanceRecord[];
            failed_transfers: Array<{
                record_id: number;
                error: string;
            }>;
        };
        message: string;
    }> {
        try {
            // Validate each destination center
            for (const transfer of data.transfers) {
                await this.validateAttendanceConditions(transfer.transfer_to_center_id);
            }
            
            // Get active event for each destination center and link
            const transfersWithEvents = await Promise.all(
                data.transfers.map(async (transfer) => {
                    const activeEvent = await this.getActiveEventForCenter(transfer.transfer_to_center_id);
                    return {
                        ...transfer,
                        event_id: activeEvent.event_id
                    };
                })
            );
            
            const response = await api.post<{
                success: boolean;
                data: {
                    successful_transfers: AttendanceRecord[];
                    failed_transfers: Array<{
                        record_id: number;
                        error: string;
                    }>;
                };
                message: string;
            }>("/attendance/transfer/batch", { transfers: transfersWithEvents }, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getAttendanceRecord(recordId: number): Promise<{
        success: boolean;
        data: AttendanceRecord;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: AttendanceRecord;
            }>(`/attendance/${recordId}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getAttendanceSummary(
        centerId: number,
        eventId?: number
    ): Promise<AttendanceSummaryResponse> {
        try {
            const params = eventId ? { event_id: eventId } : {};
            const response = await api.get<AttendanceSummaryResponse>(
                `/attendance/summary/center/${centerId}`,
                {
                    params,
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getIndividualAttendanceHistory(
        individualId: number
    ): Promise<IndividualAttendanceHistoryResponse> {
        try {
            const response = await api.get<IndividualAttendanceHistoryResponse>(
                `/attendance/history/individual/${individualId}`,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async recalculateCenterOccupancy(
        centerId: number
    ): Promise<OccupancyRecalculationResponse> {
        try {
            const response = await api.post<OccupancyRecalculationResponse>(
                `/attendance/recalculate/center/${centerId}`,
                {},
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async recalculateAllCenterOccupancies(): Promise<AllOccupanciesRecalculationResponse> {
        try {
            const response = await api.post<AllOccupanciesRecalculationResponse>(
                "/attendance/recalculate/all",
                {},
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteAttendanceRecord(recordId: number): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            // Check if record is from a resolved event
            const recordResponse = await this.getAttendanceRecord(recordId);
            const record = recordResponse.data;
            
            // Get event status
            const eventStatus = await this.getEventStatus(record.event_id);
            if (eventStatus === 'resolved') {
                throw new Error("Cannot delete attendance record from a resolved event");
            }
            
            const response = await api.delete<{
                success: boolean;
                message: string;
            }>(`/attendance/${recordId}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // Helper methods for validation
    static async validateAttendanceConditions(centerId: number): Promise<void> {
        try {
            // Check if center is active and has an active event
            const response = await api.post<{
                success: boolean;
                can_take_attendance: boolean;
                message?: string;
                center_status?: string;
                active_event?: any;
            }>(
                `/attendance/validate-center/${centerId}`,
                {},
                { withCredentials: true }
            );
            
            if (!response.data.can_take_attendance) {
                throw new Error(response.data.message || "Cannot take attendance at this center");
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes("Cannot take attendance")) {
                throw error;
            }
            // If validation endpoint doesn't exist, fall back to manual validation
            await this.manualValidateAttendanceConditions(centerId);
        }
    }

    private static async manualValidateAttendanceConditions(centerId: number): Promise<void> {
        // Check center status
        const centerStatus = await this.getCenterStatus(centerId);
        if (centerStatus.status !== 'active') {
            throw new Error(`Center ${centerId} is not active`);
        }
        
        // Check if center has an active event
        const activeEvent = await this.getActiveEventForCenter(centerId);
        if (!activeEvent) {
            throw new Error(`Center ${centerId} does not have an active event`);
        }
    }

    private static async getCenterStatus(centerId: number): Promise<{
        center_id: number;
        status: string;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    center_id: number;
                    status: string;
                }
            }>(`/evacuation_centers/${centerId}/status`, {
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            // Fallback: Assume endpoint might not exist
            return {
                center_id: centerId,
                status: 'unknown'
            };
        }
    }

    private static async getEventStatus(eventId: number): Promise<string> {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    status: string;
                }
            }>(`/events/${eventId}/status`, {
                withCredentials: true,
            });
            return response.data.data.status;
        } catch (error) {
            // Fallback: Get full event details
            const eventResponse = await api.get<{
                success: boolean;
                data: {
                    status: string;
                }
            }>(`/events/${eventId}`, {
                withCredentials: true,
            });
            return eventResponse.data.data.status;
        }
    }

    private static async getActiveEventForCenter(centerId: number): Promise<{
        event_id: number;
        event_name: string;
        status: string;
    }> {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    event_id: number;
                    event_name: string;
                    status: string;
                }
            }>(`/centers/${centerId}/active-event`, {
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            // Fallback: Get all events for center and find active one
            const eventsResponse = await api.get<{
                success: boolean;
                data: Array<{
                    event_id: number;
                    event_name: string;
                    status: string;
                }>
            }>(`/evacuation_centers/${centerId}/events`, {
                withCredentials: true,
            });
            
            const activeEvent = eventsResponse.data.data.find(event => event.status === 'active');
            if (!activeEvent) {
                throw new Error(`No active event found for center ${centerId}`);
            }
            
            return activeEvent;
        }
    }

    // Method to check if attendance can be taken at a center
    static async canTakeAttendance(centerId: number): Promise<{
        canTakeAttendance: boolean;
        message?: string;
        activeEvent?: any;
        centerStatus?: string;
    }> {
        try {
            await this.validateAttendanceConditions(centerId);
            const activeEvent = await this.getActiveEventForCenter(centerId);
            return {
                canTakeAttendance: true,
                activeEvent
            };
        } catch (error) {
            return {
                canTakeAttendance: false,
                message: error instanceof Error ? error.message : "Cannot take attendance",
                centerStatus: 'unknown'
            };
        }
    }

    // Method to get current event attendance summary
    static async getCurrentEventAttendance(): Promise<{
        success: boolean;
        data: {
            event_id: number;
            event_name: string;
            total_checked_in: number;
            total_centers: number;
            attendance_by_center: Array<{
                center_id: number;
                center_name: string;
                checked_in_count: number;
                capacity: number;
                occupancy_percentage: number;
            }>;
        };
    }> {
        try {
            // Get active event
            const activeEventResponse = await api.get<{
                success: boolean;
                data: {
                    event_id: number;
                    event_name: string;
                } | null;
            }>("/events/active", { withCredentials: true });
            
            if (!activeEventResponse.data.data) {
                throw new Error("No active event found");
            }
            
            const eventId = activeEventResponse.data.data.event_id;
            
            // Get event attendance
            const attendanceResponse = await this.getEventAttendance(eventId, { limit: 1000 });
            
            // Process attendance data
            const centersMap = new Map();
            
            if (attendanceResponse.success && attendanceResponse.data.results) {
                attendanceResponse.data.results.forEach((record: any) => {
                    if (record.status === 'checked_in') {
                        const centerId = record.center_id;
                        const centerName = record.center_name || `Center ${centerId}`;
                        
                        if (!centersMap.has(centerId)) {
                            centersMap.set(centerId, {
                                center_id: centerId,
                                center_name: centerName,
                                checked_in_count: 0,
                                capacity: record.center_capacity || 0,
                                occupancy_percentage: 0
                            });
                        }
                        
                        const centerData = centersMap.get(centerId);
                        centerData.checked_in_count++;
                        
                        // Calculate occupancy percentage
                        if (centerData.capacity > 0) {
                            centerData.occupancy_percentage = 
                                Math.round((centerData.checked_in_count / centerData.capacity) * 100);
                        }
                    }
                });
            }
            
            const attendanceByCenter = Array.from(centersMap.values());
            const totalCheckedIn = attendanceByCenter.reduce((sum, center) => sum + center.checked_in_count, 0);
            
            return {
                success: true,
                data: {
                    event_id: eventId,
                    event_name: activeEventResponse.data.data.event_name,
                    total_checked_in: totalCheckedIn,
                    total_centers: attendanceByCenter.length,
                    attendance_by_center: attendanceByCenter
                }
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}