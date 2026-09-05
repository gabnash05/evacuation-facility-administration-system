import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({ service: { getDashboardStats: vi.fn() } }));
vi.mock("@/services/statsService", () => ({ StatsService: service }));

import { useStatsStore } from "./statsStore";

describe("useStatsStore", () => {
    beforeEach(() => {
        useStatsStore.getState().resetFilters();
        useStatsStore.setState({ stats: null, error: null, loading: false });
        service.getDashboardStats.mockReset();
    });

    it("forwards gender, age, event, and explicit center scope", async () => {
        service.getDashboardStats.mockResolvedValue({
            success: true,
            data: { occupancy_stats: {}, registration_stats: {}, aid_distribution_stats: {} },
        });
        const store = useStatsStore.getState();
        store.setGenderFilter("Female");
        store.setAgeGroupFilter("adult");
        store.setEventFilter(6);

        await store.fetchStats(7);

        expect(service.getDashboardStats).toHaveBeenCalledWith({
            gender: "Female",
            age_group: "adult",
            center_id: 7,
            event_id: 6,
        });
        expect(useStatsStore.getState()).toMatchObject({ loading: false, error: null });
    });

    it("retains a usable error state when statistics retrieval fails", async () => {
        service.getDashboardStats.mockRejectedValue(new Error("offline"));

        await useStatsStore.getState().fetchStats();

        expect(useStatsStore.getState()).toMatchObject({ loading: false, error: "offline" });
    });
});
