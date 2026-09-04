import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./api", () => ({ api: { get }, handleApiError: vi.fn() }));

import { StatsService } from "./statsService";

describe("StatsService", () => {
    beforeEach(() => {
        get.mockReset();
        get.mockResolvedValue({ data: { success: true, message: "OK", data: {} } });
    });

    it("forwards the shared center and event filters to dashboard statistics", async () => {
        await StatsService.getDashboardStats({
            gender: "Female",
            age_group: "Adult",
            center_id: 2,
            event_id: 9,
        });

        expect(get).toHaveBeenCalledWith("/stats/dashboard-stats", {
            params: { gender: "Female", age_group: "Adult", center_id: 2, event_id: 9 },
            withCredentials: true,
        });
    });

    it("forwards center and event identifiers to aid distribution statistics", async () => {
        await StatsService.getAidDistributionStats(2, 9);

        expect(get).toHaveBeenCalledWith("/stats/aid-distribution-stats", {
            params: { center_id: 2, event_id: 9 },
            withCredentials: true,
        });
    });
});
