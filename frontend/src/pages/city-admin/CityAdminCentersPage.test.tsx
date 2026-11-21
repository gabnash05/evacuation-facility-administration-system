import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { CityAdminCentersPage } from "./CityAdminCentersPage";

vi.mock("@/components/features/evacuation-center/EvacuationCenterTable", () => ({
    EvacuationCenterTable: () => <div data-testid="center-table" />,
}));
vi.mock("@/components/features/evacuation-center/EvacuationCenterTableToolbar", () => ({
    EvacuationCenterTableToolbar: () => <div data-testid="center-toolbar" />,
}));
vi.mock("@/components/common/TablePagination", () => ({
    TablePagination: () => <div data-testid="pagination" />,
}));
vi.mock("@/components/features/evacuation-center/AddEvacuationCenterForm", () => ({
    AddEvacuationCenterForm: () => null,
}));
vi.mock("@/components/features/evacuation-center/SuccessToast", () => ({
    SuccessToast: () => null,
}));
vi.mock("@/components/features/evacuation-center/EvacuationCenterDetailsModal", () => ({
    EvacuationCenterDetailsModal: () => null,
}));
vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/evacuationCenterStore", () => ({ useEvacuationCenterStore: vi.fn() }));

const centerStore = {
    centers: [],
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
    fetchCenters: vi.fn(),
};

describe("CityAdminCentersPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "city_admin" } });
        vi.mocked(useEvacuationCenterStore).mockReturnValue(centerStore);
    });

    it("loads centers and renders the city administration entry view", async () => {
        render(<CityAdminCentersPage />);
        expect(screen.getByRole("heading", { name: "Evacuation Centers" })).toBeInTheDocument();
        expect(
            screen.getByText("Manage evacuation centers and their information")
        ).toBeInTheDocument();
        expect(screen.getByTestId("center-toolbar")).toBeInTheDocument();
        await waitFor(() => expect(centerStore.fetchCenters).toHaveBeenCalledOnce());
    });
});
