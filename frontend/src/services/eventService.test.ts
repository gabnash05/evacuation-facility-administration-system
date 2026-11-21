import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, handleApiError } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    handleApiError: vi.fn(() => "normalized failure"),
}));

vi.mock("./api", () => ({ api, handleApiError }));

import { EventService } from "./eventService";

describe("EventService read boundaries", () => {
    beforeEach(() => {
        api.get.mockReset();
        handleApiError.mockClear();
    });

    it("forwards list filters and active-event reads with credentials", async () => {
        api.get.mockResolvedValueOnce({ data: { success: true, data: [], pagination: {} } });
        api.get.mockResolvedValueOnce({ data: { success: true, data: null, message: "None" } });

        await EventService.getEvents({ status: "active", page: 2 });
        await EventService.getActiveEvent();

        expect(api.get).toHaveBeenNthCalledWith(1, "/events", {
            params: { status: "active", page: 2 },
            withCredentials: true,
        });
        expect(api.get).toHaveBeenNthCalledWith(2, "/events/active", {
            withCredentials: true,
        });
    });

    it("normalizes client failures", async () => {
        const failure = new Error("raw failure");
        api.get.mockRejectedValue(failure);

        await expect(EventService.getEventById(4)).rejects.toThrow("normalized failure");
        expect(handleApiError).toHaveBeenCalledWith(failure);
    });
});
