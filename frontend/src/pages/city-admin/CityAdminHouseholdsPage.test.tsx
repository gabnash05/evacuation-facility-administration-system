import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useHouseholdStore } from "@/store/householdStore";
import { CityAdminHouseholdsPage } from "./CityAdminHouseholdsPage";

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
vi.mock("@/utils/helpers", () => ({ debounce: (callback: () => void) => callback }));

describe("CityAdminHouseholdsPage", () => {
    const fetchHouseholds = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "city_admin" } });
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
            fetchHouseholds,
            deleteHousehold: vi.fn(),
        });
    });

    it("loads households when the city-admin management page opens", () => {
        render(<CityAdminHouseholdsPage />);

        expect(screen.getByRole("heading", { name: "Household Management" })).toBeInTheDocument();
        expect(fetchHouseholds).toHaveBeenCalledTimes(1);
    });
});
