import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { CenterAdminUserManagementPage } from "./CenterAdminUserManagementPage";

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

describe("CenterAdminUserManagementPage", () => {
    const fetchUsers = vi.fn();
    const setCenterFilter = vi.fn();
    const setRoleFilter = vi.fn();
    const setStatusFilter = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUserStore).mockReturnValue({
            users: [],
            loading: false,
            error: null,
            searchQuery: "",
            currentPage: 1,
            entriesPerPage: 10,
            sortConfig: null,
            pagination: null,
            setSearchQuery: vi.fn(),
            setCurrentPage: vi.fn(),
            setEntriesPerPage: vi.fn(),
            setSortConfig: vi.fn(),
            setCenterFilter,
            roleFilter: "all",
            statusFilter: "all",
            setRoleFilter,
            setStatusFilter,
            fetchUsers,
            deleteUser: vi.fn(),
            deactivateUser: vi.fn(),
            reactivateUser: vi.fn(),
        });
    });

    it("loads only the assigned center's personnel", () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { role: "center_admin", center_id: 24, center_name: "North Center" },
        });

        render(<CenterAdminUserManagementPage />);

        expect(screen.getByRole("heading", { name: "Center Personnel" })).toBeInTheDocument();
        expect(setCenterFilter).toHaveBeenCalledExactlyOnceWith(24);
        expect(fetchUsers).toHaveBeenCalledExactlyOnceWith(24);
        expect(screen.getByRole("option", { name: "Volunteer" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: "Center Admin" })).not.toBeInTheDocument();

        const [roleSelect, statusSelect] = screen.getAllByRole("combobox");
        fireEvent.change(roleSelect, { target: { value: "volunteer" } });
        fireEvent.change(statusSelect, { target: { value: "inactive" } });
        expect(setRoleFilter).toHaveBeenCalledWith("volunteer");
        expect(setStatusFilter).toHaveBeenCalledWith("inactive");
    });

    it("blocks personnel management without an assigned center", () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "center_admin" } });

        render(<CenterAdminUserManagementPage />);

        expect(screen.getByRole("alert")).toHaveTextContent("No evacuation center assigned");
        expect(fetchUsers).not.toHaveBeenCalled();
        expect(setCenterFilter).not.toHaveBeenCalled();
    });
});
