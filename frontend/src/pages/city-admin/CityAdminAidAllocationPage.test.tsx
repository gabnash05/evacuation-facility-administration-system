import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useAidAllocationStore } from "@/store/aidAllocationStore";
import type { Allocation } from "@/types/aid";
import { CityAdminAidAllocationPage } from "./CityAdminAidAllocationPage";

vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/aidAllocationStore", () => ({ useAidAllocationStore: vi.fn() }));
vi.mock("@/components/features/aid-allocation/AidAllocationForm", () => ({
    AidAllocationForm: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <p>Allocation form open</p> : null,
}));
vi.mock("@/components/features/aid-allocation/EditAllocationForm", () => ({
    EditAllocationForm: () => null,
}));

const allocation: Allocation = {
    allocation_id: 17,
    category_id: 3,
    category_name: "Food",
    center_id: 4,
    event_id: 2,
    resource_name: "Food pack",
    total_quantity: 10,
    remaining_quantity: 5,
    distribution_type: "per_household",
    status: "active",
    allocated_by_user_id: 8,
    created_at: "2026-01-01T00:00:00Z",
};

describe("CityAdminAidAllocationPage", () => {
    const store = {
        allocations: [allocation],
        searchQuery: "",
        currentPage: 3,
        entriesPerPage: 10,
        fetchAllocations: vi.fn(),
        setSearchQuery: vi.fn(),
        setCurrentPage: vi.fn(),
        updateAllocation: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "city_admin" } });
        vi.mocked(useAidAllocationStore).mockReturnValue(store);
    });

    it("loads allocations and resets pagination when the search changes", async () => {
        const { unmount } = render(<CityAdminAidAllocationPage />);
        expect(screen.getByText("Food pack")).toBeInTheDocument();
        await waitFor(() => expect(store.fetchAllocations).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByRole("textbox", { name: "Search allocations" }), {
            target: { value: "food" },
        });
        expect(store.setSearchQuery).toHaveBeenCalledWith("food");
        expect(store.setCurrentPage).toHaveBeenCalledWith(1);
        unmount();
    });

    it("offers the city administrator cancellation and submits only the status change", async () => {
        render(<CityAdminAidAllocationPage />);
        const row = screen.getByRole("row", { name: /Food pack/ });
        fireEvent.keyDown(within(row).getByRole("button"), { key: "Enter" });
        expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
        expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
        expect(screen.queryByRole("menuitem", { name: "Distribute" })).not.toBeInTheDocument();

        await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "Cancel" })));
        expect(store.updateAllocation).toHaveBeenCalledExactlyOnceWith(17, { status: "cancelled" });
        expect(await screen.findByText("Allocation cancelled")).toBeInTheDocument();
    });
});
