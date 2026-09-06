import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, handleApiError } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    handleApiError: vi.fn(() => "normalized failure"),
}));

vi.mock("./api", () => ({ api, handleApiError }));

import { AidAllocationService } from "./aidAllocationService";

describe("AidAllocationService", () => {
    beforeEach(() => {
        Object.values(api).forEach(method => method.mockReset());
        handleApiError.mockClear();
    });

    it("forwards allocation filters and center-specific sorting with credentials", async () => {
        api.get.mockResolvedValue({ data: { success: true, data: [], pagination: {} } });

        await AidAllocationService.getAllocations({ center_id: 3, sortBy: "resource_name" });
        await AidAllocationService.getCenterAllocations(3, { status: "active", sortOrder: "desc" });

        expect(api.get).toHaveBeenNthCalledWith(1, "/allocations", {
            params: {
                center_id: 3,
                sortBy: "resource_name",
                sort_by: "resource_name",
                sort_order: undefined,
            },
            withCredentials: true,
        });
        expect(api.get).toHaveBeenNthCalledWith(2, "/allocations/center/3", {
            params: {
                status: "active",
                sortOrder: undefined,
                sort_by: undefined,
                sort_order: "desc",
            },
            withCredentials: true,
        });
    });

    it("uses JSON credentialed mutation requests and normalizes failures", async () => {
        const payload = {
            center_id: 3,
            event_id: 4,
            category_id: 5,
            resource_name: "Rice",
            total_quantity: 10,
            distribution_type: "per_household" as const,
        };
        api.post.mockResolvedValue({ data: { success: true, data: {} } });

        await AidAllocationService.createAllocation(payload);

        expect(api.post).toHaveBeenCalledWith("/allocations", payload, {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
        });

        const failure = new Error("offline");
        api.get.mockRejectedValue(failure);
        await expect(AidAllocationService.getCategories()).rejects.toThrow("normalized failure");
        expect(handleApiError).toHaveBeenCalledWith(failure);
    });
});
