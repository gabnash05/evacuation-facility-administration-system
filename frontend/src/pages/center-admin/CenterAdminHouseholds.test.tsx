import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useHouseholdStore } from "@/store/householdStore";
import { CenterAdminHouseholdsPage } from "./CenterAdminHouseholds";

vi.mock("@/components/features/household/HouseholdTable", () => ({ HouseholdTable: () => null }));
vi.mock("@/components/features/household/HouseholdTableToolbar", () => ({
    HouseholdTableToolbar: () => null,
}));
vi.mock("@/components/common/TablePagination", () => ({ TablePagination: () => null }));
vi.mock("@/components/features/household/AddHouseholdModal", () => ({
    AddHouseholdModal: () => null,
}));
vi.mock("@/components/features/household/EditHouseholdModal", () => ({
    EditHouseholdModal: () => null,
}));
vi.mock("@/components/features/household/HouseholdDetailsModal", () => ({
    HouseholdDetailsModal: () => null,
}));
vi.mock("@/components/common/SuccessToast", () => ({ SuccessToast: () => null }));
vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/householdStore", () => ({ useHouseholdStore: vi.fn() }));

describe("CenterAdminHouseholdsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: null });
        vi.mocked(useHouseholdStore).mockReturnValue({
            households: [],
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
            fetchHouseholds: vi.fn(),
            deleteHousehold: vi.fn(),
        });
    });

    it("blocks household management when no evacuation center is assigned", () => {
        render(<CenterAdminHouseholdsPage />);
        expect(screen.getByText(/No evacuation center assigned/)).toBeInTheDocument();
    });
});
