import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({ service: { getAllocations: vi.fn() } }));
vi.mock("../services/aidAllocationService", () => ({ AidAllocationService: service }));

import { useAidAllocationStore } from "./aidAllocationStore";

describe("useAidAllocationStore", () => {
    beforeEach(() => {
        useAidAllocationStore.getState().resetState();
        service.getAllocations.mockReset();
    });

    it("forwards table state and clears stale data without browser logging on failure", async () => {
        service.getAllocations.mockRejectedValue(new Error("offline"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const store = useAidAllocationStore.getState();
        store.setSearchQuery("rice");
        store.setCurrentPage(2);

        await store.fetchAllocations();

        expect(service.getAllocations).toHaveBeenCalledWith({
            search: "rice",
            page: 2,
            limit: 10,
            sortBy: undefined,
            sortOrder: undefined,
        });
        expect(useAidAllocationStore.getState()).toMatchObject({
            allocations: [],
            pagination: null,
            loading: false,
            allocationsLoading: false,
            error: "offline",
            allocationsError: "offline",
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
