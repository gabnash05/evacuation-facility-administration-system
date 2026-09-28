import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useAidAllocationStore } from "@/store/aidAllocationStore";
import { CenterAdminAidAllocationPage } from "./CenterAdminAidAllocationPage";

vi.mock("@/components/features/aid-allocation/AidAllocationTable", () => ({
    AidDistributionTable: () => <div data-testid="allocation-table" />,
}));

vi.mock("@/components/features/aid-allocation/AidAllocationToolbar", () => ({
    AidDistributionToolbar: () => <div data-testid="allocation-toolbar" />,
}));

vi.mock("@/components/common/TablePagination", () => ({
    TablePagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/aidAllocationStore", () => ({ useAidAllocationStore: vi.fn() }));

const allocationStore = {
    allocations: [],
    pagination: null,
    loading: false,
    error: null,
    searchQuery: "",
    currentPage: 1,
    entriesPerPage: 10,
    sortConfig: null,
    setSearchQuery: vi.fn(),
    setCurrentPage: vi.fn(),
    setEntriesPerPage: vi.fn(),
    setSortConfig: vi.fn(),
    fetchCenterAllocations: vi.fn(),
};

describe("CenterAdminAidAllocationPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAidAllocationStore).mockReturnValue(allocationStore);
    });

    it("shows a clear error when the authenticated user has no assigned center", () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null });

        render(<CenterAdminAidAllocationPage />);

        expect(screen.getByText(/No evacuation center assigned/)).toBeInTheDocument();
        expect(screen.queryByTestId("allocation-table")).not.toBeInTheDocument();
    });

    it("renders the selected center name for a center administrator", () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { center_id: 7, center_name: "North Center" },
        });

        render(<CenterAdminAidAllocationPage />);

        expect(screen.getByRole("heading", { name: "Aid Allocation" })).toBeInTheDocument();
        expect(screen.getByText("View allocations for North Center")).toBeInTheDocument();
    });
});
