import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, handleApiError } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    handleApiError: vi.fn(() => "normalized failure"),
}));

vi.mock("./api", () => ({ api, handleApiError }));

import { DistributionService } from "./distributionService";

describe("DistributionService", () => {
    beforeEach(() => {
        Object.values(api).forEach(method => method.mockReset());
        handleApiError.mockClear();
    });

    it("serializes supported history filters and uses credentialed mutations", async () => {
        api.get.mockResolvedValue({ data: { success: true, data: [] } });
        api.post.mockResolvedValue({ data: { success: true } });

        await DistributionService.getHistory({
            search: "rice",
            page: 2,
            limit: 25,
            center_id: 3,
            sort_by: "distribution_date",
            sort_order: "desc",
        });
        await DistributionService.create({
            household_id: 7,
            items: [{ allocation_id: 4, quantity: 2 }],
        });

        expect(api.get).toHaveBeenCalledWith(
            `/distributions/history?${new URLSearchParams({
                search: "rice",
                page: "2",
                limit: "25",
                center_id: "3",
                sort_by: "distribution_date",
                sort_order: "desc",
            }).toString()}`
        );
        expect(api.post).toHaveBeenCalledWith(
            "/distributions",
            { household_id: 7, items: [{ allocation_id: 4, quantity: 2 }] },
            { withCredentials: true }
        );
    });

    it("normalizes API failures", async () => {
        const failure = new Error("offline");
        api.delete.mockRejectedValue(failure);

        await expect(DistributionService.delete(8)).rejects.toThrow("normalized failure");
        expect(handleApiError).toHaveBeenCalledWith(failure);
    });
});
