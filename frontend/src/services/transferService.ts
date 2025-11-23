import { api, handleApiError } from "./api";
import type {
    TransferIndividual,
    TransferCenter,
    TransferIndividualData,
    TransferIndividualsResponse,
    TransferCentersResponse,
    TransferSubmitResponse,
    GetTransferIndividualsParams,
} from "@/types/transfer";

// Mock data for individuals (will be replaced with real API)
const mockIndividuals: TransferIndividual[] = [
    {
        individual_id: 1,
        first_name: "Tyla",
        last_name: "Flores",
        household_id: 1,
        household_name: "Flores",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "sick",
        date_of_birth: "1990-05-15",
        gender: "Female",
    },
    {
        individual_id: 2,
        first_name: "Neymar",
        last_name: "Cruz",
        household_id: 2,
        household_name: "Cruz",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "injured",
        date_of_birth: "1985-03-20",
        gender: "Male",
    },
    {
        individual_id: 3,
        first_name: "Jake",
        last_name: "Bautista",
        household_id: 3,
        household_name: "Bautista",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "sick",
        date_of_birth: "1995-07-10",
        gender: "Male",
    },
    {
        individual_id: 4,
        first_name: "Maria",
        last_name: "Bautista",
        household_id: 3,
        household_name: "Bautista",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "sick",
        date_of_birth: "1992-11-25",
        gender: "Female",
    },
    {
        individual_id: 5,
        first_name: "Anna",
        last_name: "Dela Cruz",
        household_id: 4,
        household_name: "Dela Cruz",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "injured",
        date_of_birth: "1988-09-30",
        gender: "Female",
    },
    {
        individual_id: 6,
        first_name: "Tyler",
        last_name: "Vargas",
        household_id: 5,
        household_name: "Vargas",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "sick",
        date_of_birth: "1998-01-18",
        gender: "Male",
    },
    {
        individual_id: 7,
        first_name: "Sonya",
        last_name: "Montero",
        household_id: 6,
        household_name: "Montero",
        center_id: 1,
        center_name: "Bagong Silang Barangay Hall/Gym",
        status: "at_risk",
        date_of_birth: "2000-06-05",
        gender: "Female",
    },
];

// Mock data for evacuation centers (will be replaced with real API)
const mockCenters: TransferCenter[] = [
    {
        center_id: 2,
        center_name: "San Lorenzo Parish Church",
        address: "San Lorenzo",
        capacity: 500,
        current_occupancy: 100,
        status: "active",
    },
    {
        center_id: 3,
        center_name: "Iligan City National High School",
        address: "Iligan City",
        capacity: 1000,
        current_occupancy: 600,
        status: "active",
    },
    {
        center_id: 4,
        center_name: "Iligan City National High School - Annex",
        address: "Iligan City",
        capacity: 1000,
        current_occupancy: 50,
        status: "active",
    },
];

export class TransferService {
    /**
     * Get individuals available for transfer
     * TODO: Replace with real API call when backend is ready
     */
    static async getIndividualsForTransfer(
        params: GetTransferIndividualsParams = {}
    ): Promise<TransferIndividualsResponse> {
        try {
            // Mock implementation - simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            let filteredIndividuals = [...mockIndividuals];

            // Apply search filter
            if (params.search) {
                const searchLower = params.search.toLowerCase();
                filteredIndividuals = filteredIndividuals.filter(
                    individual =>
                        individual.first_name.toLowerCase().includes(searchLower) ||
                        individual.last_name.toLowerCase().includes(searchLower) ||
                        individual.household_name.toLowerCase().includes(searchLower)
                );
            }

            // Apply status filter
            if (params.status) {
                filteredIndividuals = filteredIndividuals.filter(
                    individual => individual.status === params.status
                );
            }

            // Apply center filter
            if (params.center_id) {
                filteredIndividuals = filteredIndividuals.filter(
                    individual => individual.center_id === params.center_id
                );
            }

            // TODO: When backend is ready, replace with:
            // const response = await api.get<TransferIndividualsResponse>(
            //     "/transfers/individuals",
            //     { params, withCredentials: true }
            // );
            // return response.data;

            return {
                success: true,
                message: "Individuals retrieved successfully",
                data: {
                    results: filteredIndividuals,
                    pagination: {
                        current_page: params.page || 1,
                        total_pages: 1,
                        total_items: filteredIndividuals.length,
                        limit: params.limit || 10,
                    },
                },
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get available evacuation centers for transfer
     * TODO: Replace with real API call when backend is ready
     */
    static async getAvailableCenters(): Promise<TransferCentersResponse> {
        try {
            // Mock implementation - simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));

            // TODO: When backend is ready, replace with:
            // const response = await api.get<TransferCentersResponse>(
            //     "/transfers/available-centers",
            //     { withCredentials: true }
            // );
            // return response.data;

            return {
                success: true,
                message: "Centers retrieved successfully",
                data: mockCenters,
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Submit transfer request
     * TODO: Replace with real API call when backend is ready
     */
    static async transferIndividuals(
        data: TransferIndividualData
    ): Promise<TransferSubmitResponse> {
        try {
            // Mock implementation - simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log("Transfer request:", data);

            // TODO: When backend is ready, replace with:
            // const response = await api.post<TransferSubmitResponse>(
            //     "/transfers/individuals",
            //     data,
            //     { withCredentials: true }
            // );
            // return response.data;

            // Mock success response
            return {
                success: true,
                message: `Successfully transferred ${data.individual_ids.length} individual(s)`,
                data: {
                    transfer_records: data.individual_ids.map((id, index) => ({
                        record_id: 1000 + index,
                        individual_id: id,
                        from_center_id: 1, // Mock current center
                        to_center_id: data.destination_center_id,
                        transfer_time: new Date().toISOString(),
                        reason: data.reason,
                        status: "transferred" as const,
                        recorded_by_user_id: 1, // Mock user ID
                        notes: data.notes,
                    })),
                    message: `Successfully transferred ${data.individual_ids.length} individual(s)`,
                },
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get transfer history for a center
     * TODO: Implement when needed
     */
    static async getTransferHistory(centerId: number): Promise<any> {
        try {
            // TODO: Implement when backend is ready
            throw new Error("Not implemented yet");
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}