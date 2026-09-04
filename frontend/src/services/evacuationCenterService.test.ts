import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./api", () => ({ api: { get }, handleApiError: vi.fn() }));

import { EvacuationCenterService } from "./evacuationCenterService";

describe("EvacuationCenterService", () => {
    beforeEach(() => {
        get.mockReset();
        get.mockResolvedValue({ data: { success: true, data: [], message: "OK" } });
    });

    it("sends documented coordinate and range parameters for nearby center lookup", async () => {
        await EvacuationCenterService.getCentersByProximity(14.6, 121.0, 5, 20);

        expect(get).toHaveBeenCalledWith("/evacuation_centers/nearby", {
            params: { lat: 14.6, lng: 121.0, radius: 5, limit: 20 },
            withCredentials: true,
        });
    });
});
