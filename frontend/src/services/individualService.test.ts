import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, handleApiError } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    handleApiError: vi.fn(() => "normalized failure"),
}));

vi.mock("./api", () => ({ api, handleApiError }));

import { IndividualService } from "./individualService";

describe("IndividualService", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
        api.delete.mockReset();
        handleApiError.mockClear();
    });

    it("removes absent filters before listing credentialed individual requests", async () => {
        const response = { data: { success: true, data: [], pagination: {} } };
        api.get.mockResolvedValue(response);

        await expect(
            IndividualService.getIndividuals({ search: "Ana", center_id: 7, limit: 25 })
        ).resolves.toBe(response.data);

        expect(api.get).toHaveBeenCalledWith("/individuals", {
            params: { search: "Ana", page: 1, limit: 25, center_id: 7 },
            withCredentials: true,
        });
    });

    it("uses the established individual mutation and search request contracts", async () => {
        api.post.mockResolvedValue({ data: { success: true } });
        api.delete.mockResolvedValue({ data: { success: true, data: { deleted_ids: [2, 3] } } });
        api.get.mockResolvedValue({ data: { success: true, data: [] } });

        await IndividualService.recalculateStatuses();
        await IndividualService.deleteIndividuals([2, 3]);
        await IndividualService.searchIndividuals("Ana", 5);

        expect(api.post).toHaveBeenCalledWith(
            "/individuals/recalculate-statuses",
            {},
            { withCredentials: true }
        );
        expect(api.delete).toHaveBeenCalledWith("/individuals", {
            withCredentials: true,
            data: { ids: [2, 3] },
        });
        expect(api.get).toHaveBeenLastCalledWith("/individuals/search", {
            params: { name: "Ana", limit: 5 },
            withCredentials: true,
        });
    });

    it("normalizes API failures before callers receive them", async () => {
        const failure = new Error("raw failure");
        api.get.mockRejectedValue(failure);

        await expect(IndividualService.getIndividualById(9)).rejects.toThrow("normalized failure");
        expect(handleApiError).toHaveBeenCalledWith(failure);
    });
});
