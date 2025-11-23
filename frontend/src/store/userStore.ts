import { create } from "zustand";
import { UserService } from "@/services/userService";
import type { User, UsersResponse, GetUsersParams } from "@/types/user";
import type { CreateUserFormData, UpdateUserFormData } from "@/schemas/user";

interface UserState {
    users: User[];
    currentUser: User | null;
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
    centerFilter: number | null; // Add center filter

    // Actions
    setCurrentUser: (user: User) => void;
    clearCurrentUser: () => void;
    setSearchQuery: (query: string) => void;
    setCurrentPage: (page: number) => void;
    setEntriesPerPage: (entries: number) => void;
    setSortConfig: (config: { key: string; direction: "asc" | "desc" | null } | null) => void;
    setCenterFilter: (centerId: number | null) => void; // Add center filter action
    fetchUsers: (centerId?: number | null) => Promise<void>; // Update to accept centerId
    initializeCurrentUser: () => Promise<void>;
    fetchCurrentUser: () => Promise<void>;
    createUser: (userData: CreateUserFormData) => Promise<void>;
    updateUser: (id: number, updates: UpdateUserFormData) => Promise<void>;
    deleteUser: (id: number) => Promise<void>;
    deactivateUser: (id: number) => Promise<void>;
    resetState: () => void;
}

const initialState = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    pagination: null,
    centerFilter: null, // Add to initial state
};

export const useUserStore = create<UserState>((set, get) => ({
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

    setCenterFilter: (centerId: number | null) => {
        set({ centerFilter: centerId, currentPage: 1 });
    },

    fetchUsers: async (centerId?: number | null) => {
        const { searchQuery, currentPage, entriesPerPage, sortConfig, centerFilter } = get();

        // Use provided centerId or fall back to store's centerFilter
        const targetCenterId = centerId !== undefined ? centerId : centerFilter;

        set({ loading: true, error: null });

        try {
            const params: GetUsersParams = {
                search: searchQuery,
                page: currentPage,
                limit: entriesPerPage,
                sortBy: sortConfig?.key,
                sortOrder: sortConfig?.direction || undefined,
                centerId: targetCenterId !== null ? targetCenterId : undefined, // Only include if not null
            };

            const response: UsersResponse = await UserService.getUsers(params);

            set({
                users: response.data.results,
                pagination: response.data.pagination,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch users",
                loading: false,
                users: [],
                pagination: null,
            });
        }
    },

    setCurrentUser: (user: User) => {
        set({ currentUser: user });
    },

    clearCurrentUser: () => {
        set({ currentUser: null });
    },

    initializeCurrentUser: async () => {
        const { currentUser } = get();
        if (!currentUser) {
            await get().fetchCurrentUser();
        }
    },

    fetchCurrentUser: async () => {
        set({ loading: true, error: null });
        try {
            const response = await UserService.getCurrentUser();
            console.log(response);
            set({
                currentUser: response.data,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch current user",
                loading: false,
            });
        }
    },

    createUser: async (userData: CreateUserFormData) => {
        try {
            await UserService.createUser(userData);
            await get().fetchUsers(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create user");
        }
    },

    updateUser: async (id: number, updates: UpdateUserFormData) => {
        try {
            await UserService.updateUser(id, updates);
            await get().fetchUsers(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to update user");
        }
    },

    deleteUser: async (id: number) => {
        try {
            await UserService.deleteUser(id);
            await get().fetchUsers(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete user");
        }
    },

    deactivateUser: async (id: number) => {
        try {
            await UserService.deleteUser(id);
            await get().fetchUsers(); // Refresh the list
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to deactivate user");
        }
    },

    resetState: () => {
        set(initialState);
    },

    name: "user-storage" as const,
    partialize: (state: UserState): Pick<UserState, "currentUser"> => ({
        currentUser: state.currentUser,
    }),
}));
