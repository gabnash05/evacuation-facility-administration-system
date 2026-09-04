import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({
    service: { getHouseholds: vi.fn() },
}));

vi.mock("@/services/householdService", () => ({ HouseholdService: service }));

import { useHouseholdStore } from "./householdStore";

describe("useHouseholdStore", () => {
    beforeEach(() => {
        useHouseholdStore.getState().resetState();
        service.getHouseholds.mockReset();
    });

    it("forwards current table state and center scope to household retrieval", async () => {
        service.getHouseholds.mockResolvedValue({
            success: true,
            data: {
                results: [{ household_id: 3, household_name: "Santos" }],
                pagination: { current_page: 2, total_pages: 4, total_items: 31, limit: 25 },
            },
        });
        const store = useHouseholdStore.getState();
        store.setSearchQuery("Santos");
        store.setEntriesPerPage(25);
        store.setSortConfig({ key: "household_name", direction: "asc" });
        store.setCurrentPage(2);

        await store.fetchHouseholds(9);

        expect(service.getHouseholds).toHaveBeenCalledWith({
            search: "Santos",
            page: 2,
            limit: 25,
            sortBy: "household_name",
            sortOrder: "asc",
            centerId: 9,
        });
        expect(useHouseholdStore.getState()).toMatchObject({
            households: [{ household_id: 3, household_name: "Santos" }],
            pagination: { current_page: 2, total_pages: 4, total_items: 31, limit: 25 },
            loading: false,
            error: null,
        });
    });

    it("clears stale households and pagination after retrieval fails", async () => {
        service.getHouseholds.mockRejectedValue(new Error("offline"));
        useHouseholdStore.setState({
            households: [{ household_id: 3 } as any],
            pagination: { current_page: 1, total_pages: 1, total_items: 1, limit: 10 },
        });

        await useHouseholdStore.getState().fetchHouseholds();

        expect(useHouseholdStore.getState()).toMatchObject({
            households: [],
            pagination: null,
            loading: false,
            error: "offline",
        });
    });
});
