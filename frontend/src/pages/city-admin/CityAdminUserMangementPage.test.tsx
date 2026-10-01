import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { CityAdminUserManagementPage } from "./CityAdminUserMangementPage";

vi.mock("@/components/features/user-management/UserTable", () => ({ UserTable: () => null }));
vi.mock("@/components/common/Toolbar", () => ({
    TableToolbar: ({ additionalFilters }: { additionalFilters: ReactNode }) => (
        <div>{additionalFilters}</div>
    ),
}));
vi.mock("@/components/common/TablePagination", () => ({ TablePagination: () => null }));
vi.mock("@/components/features/user-management/AddEditUserModal", () => ({
    AddEditUserModal: () => null,
}));
vi.mock("@/components/features/user-management/DeleteConfirmationModal", () => ({
    DeleteConfirmationModal: () => null,
}));
vi.mock("@/components/features/user-management/DeactivateConfirmationModal", () => ({
    DeactivateConfirmationModal: () => null,
}));
vi.mock("@/components/ui/select", () => ({
    Select: ({
        children,
        value,
        onValueChange,
    }: {
        children: ReactNode;
        value: string;
        onValueChange: (value: string) => void;
    }) => (
        <select value={value} onChange={event => onValueChange(event.target.value)}>
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
        <option value={value}>{children}</option>
    ),
}));
vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/userStore", () => ({ useUserStore: vi.fn() }));
vi.mock("@/utils/helpers", () => ({ debounce: (callback: () => void) => callback }));

describe("CityAdminUserManagementPage", () => {
    const fetchUsers = vi.fn();
    const setRoleFilter = vi.fn();
    const setStatusFilter = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "city_admin" } });
        vi.mocked(useUserStore).mockReturnValue({
            users: [],
            loading: false,
            error: null,
            searchQuery: "",
            currentPage: 1,
            entriesPerPage: 10,
            sortConfig: null,
            pagination: null,
            roleFilter: "all",
            statusFilter: "all",
            setSearchQuery: vi.fn(),
            setCurrentPage: vi.fn(),
            setEntriesPerPage: vi.fn(),
            setSortConfig: vi.fn(),
            setRoleFilter,
            setStatusFilter,
            fetchUsers,
            deleteUser: vi.fn(),
            deactivateUser: vi.fn(),
            reactivateUser: vi.fn(),
        });
    });

    it("shows allowed user filters and forwards selections to shared query state", () => {
        render(<CityAdminUserManagementPage />);

        expect(screen.getByRole("heading", { name: "User Management" })).toBeInTheDocument();
        expect(fetchUsers).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("option", { name: "Center Admin" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Volunteer" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: "Super Admin" })).not.toBeInTheDocument();

        const [roleSelect, statusSelect] = screen.getAllByRole("combobox");
        fireEvent.change(roleSelect, { target: { value: "center_admin" } });
        fireEvent.change(statusSelect, { target: { value: "inactive" } });
        expect(setRoleFilter).toHaveBeenCalledWith("center_admin");
        expect(setStatusFilter).toHaveBeenCalledWith("inactive");
    });
});
