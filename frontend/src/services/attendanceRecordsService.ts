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
            const response = await api.post<{
                success: boolean;
                data: AttendanceRecord;
                message: string;
            }>("/attendance/check-in", data, {
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
            const response = await api.post<{
                success: boolean;
                data: AttendanceRecord[];
                message: string;
            }>("/attendance/check-in/batch", data, {
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

    static async transferIndividual(
        recordId: number,
        data: TransferData
    ): Promise<{
        success: boolean;
        data: AttendanceRecord;
        message: string;
    }> {
        try {
            const response = await api.put<{
                success: boolean;
                data: AttendanceRecord;
                message: string;
            }>(`/attendance/${recordId}/transfer`, data, {
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
}
