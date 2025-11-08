import { api, handleApiError } from "./api";
import type { UsersResponse, GetUsersParams } from "@/types/user";
import type { CreateUserFormData, UpdateUserFormData } from "@/schemas/user";

export class UserService {
    static async getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
        try {
            const response = await api.get<UsersResponse>("/users", {
                params,
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async getUserById(id: number): Promise<UsersResponse> {
        try {
            const response = await api.get<UsersResponse>(`/users/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async createUser(data: CreateUserFormData): Promise<UsersResponse> {
        try {
            const response = await api.post<UsersResponse>("/users", data, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async updateUser(id: number, updates: UpdateUserFormData): Promise<UsersResponse> {
        try {
            const response = await api.put<UsersResponse>(`/users/${id}`, updates, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deleteUser(id: number): Promise<UsersResponse> {
        try {
            const response = await api.delete<UsersResponse>(`/users/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    static async deactivateUser(id: number): Promise<UsersResponse> {
        try {
            const response = await api.patch<UsersResponse>(
                `/users/${id}/deactivate`,
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
}
