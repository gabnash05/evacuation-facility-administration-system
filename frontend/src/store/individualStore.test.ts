import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({
    service: { getIndividuals: vi.fn() },
}));

vi.mock("@/services/individualService", () => ({ IndividualService: service }));

import { useIndividualStore } from "./individualStore";

describe("useIndividualStore", () => {
    beforeEach(() => {
        useIndividualStore.getState().resetState();
        service.getIndividuals.mockReset();
    });

    it("forwards current filters and pagination to the individual service", async () => {
        service.getIndividuals.mockResolvedValue({
            success: true,
            data: {
                results: [{ individual_id: 8, first_name: "Ana" }],
                pagination: { current_page: 2, total_pages: 3, total_items: 21, limit: 10 },
                filters: { applied_filters: { status: "evacuated", search: "Ana" } },
            },
        });
        const store = useIndividualStore.getState();
        store.setSearchQuery("Ana");
        store.setFilter("status", "evacuated");
        store.setCurrentPage(2);

        await store.fetchIndividuals();

        expect(service.getIndividuals).toHaveBeenCalledWith({
            search: "Ana",
            page: 2,
            limit: 10,
            sortBy: undefined,
            sortOrder: undefined,
            household_id: undefined,
            status: "evacuated",
            gender: undefined,
            age_group: undefined,
            center_id: undefined,
        });
        expect(useIndividualStore.getState()).toMatchObject({
            individuals: [{ individual_id: 8, first_name: "Ana" }],
            paginatedIndividuals: [{ individual_id: 8, first_name: "Ana" }],
            totalRecords: 21,
            pagination: { current_page: 2, total_pages: 3, total_items: 21, limit: 10 },
            loading: false,
            error: null,
        });
    });

    it("clears stale individual records and pagination after a refresh failure", async () => {
        service.getIndividuals.mockRejectedValue(new Error("offline"));
        useIndividualStore.setState({
            individuals: [{ individual_id: 8 } as any],
            paginatedIndividuals: [{ individual_id: 8 } as any],
            totalRecords: 1,
            pagination: { current_page: 1, total_pages: 1, total_items: 1, limit: 10 },
        });

        await useIndividualStore.getState().fetchIndividuals();

        expect(useIndividualStore.getState()).toMatchObject({
            individuals: [],
            paginatedIndividuals: [],
            totalRecords: 0,
            pagination: null,
            loading: false,
            error: "offline",
        });
    });
});
