import { api, handleApiError } from "./api";
import type {
    Household,
    HouseholdResponse,
    HouseholdsResponse,
    CreateHouseholdData,
    UpdateHouseholdData,
    GetHouseholdsParams,
} from "@/types/households";
import type { CreateIndividualData, IndividualResponse } from "@/types/individual";

// Interface for the actual API response from backend
interface ActualHouseholdsResponse {
    success: boolean;
    message?: string;
    data: Household[];
    pagination: {
        page: number;
        per_page: number;
        page_count: number;
        total_records: number;
    };
}

export class HouseholdService {
    static async getHouseholds(
        params: GetHouseholdsParams & { centerId?: number } = {}
    ): Promise<HouseholdsResponse> {
        try {
            // Map frontend params to backend expected query params
            const backendParams: any = {};
            if (params.search) backendParams.search = params.search;
            if (params.page) backendParams.page = params.page;
            if (params.limit) backendParams.per_page = params.limit;
            if (params.sortBy) backendParams.sort_by = params.sortBy;
            if (params.sortOrder) backendParams.sort_order = params.sortOrder;
            if (params.centerId) backendParams.center_id = params.centerId;

            const response = await api.get<ActualHouseholdsResponse>("/households", {
                params: backendParams,
                withCredentials: true,
            });

            const body = response.data;

            const transformedResponse: HouseholdsResponse = {
                success: body.success,
                message: body.message || "Success",
                data: {
                    results: body.data,
                    pagination: {
                        current_page: body.pagination.page,
                        total_pages: body.pagination.page_count,
                        total_items: body.pagination.total_records,
                        limit: body.pagination.per_page,
                    },
                },
            };

            return transformedResponse;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getHouseholdDetails(id: number): Promise<HouseholdResponse> {
        try {
            const response = await api.get<HouseholdResponse>(`/households/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // Alias for getHouseholdDetails to maintain backward compatibility
    static async getHouseholdById(id: number): Promise<HouseholdResponse> {
        return this.getHouseholdDetails(id);
    }

    static async createHousehold(data: CreateHouseholdData): Promise<HouseholdResponse> {
        try {
            const payload: any = {
                household_name: data.household_name,
                address: data.address,
                center_id: data.center_id,
            };
            if ((data as any).individuals) payload.individuals = (data as any).individuals;

            const response = await api.post<HouseholdResponse>(
                "/households-with-individuals",
                payload,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createHouseholdIndividual(
        householdId: number,
        individualData: CreateIndividualData
    ): Promise<IndividualResponse> {
        try {
            const response = await api.post<IndividualResponse>(
                `/households/${householdId}/individuals`,
                individualData,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateHousehold(
        id: number,
        updates: UpdateHouseholdData
    ): Promise<HouseholdResponse> {
        try {
            const response = await api.put<HouseholdResponse>(`/households/${id}`, updates, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteHousehold(id: number): Promise<HouseholdResponse> {
        try {
            const response = await api.delete<HouseholdResponse>(`/households/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getHouseholdIndividuals(householdId: number): Promise<any> {
        try {
            const response = await api.get(`/households/${householdId}/individuals`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}
