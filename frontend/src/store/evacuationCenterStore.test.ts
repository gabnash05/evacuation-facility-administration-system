import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({
    service: { getCenters: vi.fn() },
}));

vi.mock("@/services/evacuationCenterService", () => ({ EvacuationCenterService: service }));

import { useEvacuationCenterStore } from "./evacuationCenterStore";

describe("useEvacuationCenterStore", () => {
    beforeEach(() => {
        useEvacuationCenterStore.getState().resetState();
    });

    it("forwards current table state to the paginated service and stores its response", async () => {
        service.getCenters.mockResolvedValue({
            data: {
                results: [{ center_id: 4, center_name: "North Hall" }],
                pagination: { current_page: 2, total_pages: 3, total_items: 21, limit: 10 },
            },
        });
        const store = useEvacuationCenterStore.getState();
        store.setSearchQuery("north");
        store.setSortConfig({ key: "center_name", direction: "asc" });
        store.setCurrentPage(2);

        await store.fetchCenters();

        expect(service.getCenters).toHaveBeenCalledWith({
            search: "north",
            page: 2,
            limit: 10,
            sortBy: "center_name",
            sortOrder: "asc",
        });
        expect(useEvacuationCenterStore.getState()).toMatchObject({
            centers: [{ center_id: 4, center_name: "North Hall" }],
            pagination: { current_page: 2, total_pages: 3, total_items: 21, limit: 10 },
            loading: false,
            error: null,
        });
    });

    it("clears stale centers and pagination after a fetch failure", async () => {
        service.getCenters.mockRejectedValue(new Error("offline"));
        useEvacuationCenterStore.setState({
            centers: [{ center_id: 4 } as any],
            pagination: { current_page: 1, total_pages: 1, total_items: 1, limit: 10 },
        });

        await useEvacuationCenterStore.getState().fetchCenters();

        expect(useEvacuationCenterStore.getState()).toMatchObject({
            centers: [],
            pagination: null,
            loading: false,
            error: "offline",
        });
    });
});
