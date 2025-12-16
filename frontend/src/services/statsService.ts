import { api, handleApiError } from "./api";
import type {
    DashboardStatsResponse,
    OccupancyStatsResponse,
    RegistrationStatsResponse,
    AidDistributionStatsResponse,
    StatsFilter,
} from "@/types/stats";

export class StatsService {
    static async getDashboardStats(filters?: StatsFilter): Promise<DashboardStatsResponse> {
        try {
            const params: Record<string, any> = {};

            if (filters?.gender) {
                params.gender = filters.gender;
            }
            if (filters?.age_group) {
                params.age_group = filters.age_group;
            }
            if (filters?.center_id) {
                params.center_id = filters.center_id;
            }
            if (filters?.event_id) {  // NEW
                params.event_id = filters.event_id;
            }

            const response = await api.get<DashboardStatsResponse>("/stats/dashboard-stats", {
                params,
                withCredentials: true,
            });

            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getOccupancyStats(filters?: StatsFilter): Promise<OccupancyStatsResponse> {
        try {
            const params: Record<string, any> = {};

            if (filters?.gender) {
                params.gender = filters.gender;
            }
            if (filters?.age_group) {
                params.age_group = filters.age_group;
            }
            if (filters?.center_id) {
                params.center_id = filters.center_id;
            }
            if (filters?.event_id) {  // NEW
                params.event_id = filters.event_id;
            }

            const response = await api.get<OccupancyStatsResponse>("/stats/occupancy-stats", {
                params,
                withCredentials: true,
            });

            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getRegistrationStats(
        filters?: StatsFilter
    ): Promise<RegistrationStatsResponse> {
        try {
            const params: Record<string, any> = {};

            if (filters?.gender) {
                params.gender = filters.gender;
            }
            if (filters?.age_group) {
                params.age_group = filters.age_group;
            }
            if (filters?.center_id) {
                params.center_id = filters.center_id;
            }
            if (filters?.event_id) {  // NEW
                params.event_id = filters.event_id;
            }

            const response = await api.get<RegistrationStatsResponse>(
                "/stats/registration-stats",
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

    static async getAidDistributionStats(
        centerId?: number,
        eventId?: number  // NEW
    ): Promise<AidDistributionStatsResponse> {
        try {
            const params: Record<string, any> = {};

            if (centerId) {
                params.center_id = centerId;
            }
            if (eventId) {  // NEW
                params.event_id = eventId;
            }

            const response = await api.get<AidDistributionStatsResponse>(
                "/stats/aid-distribution-stats",
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
}