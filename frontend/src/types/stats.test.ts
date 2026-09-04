import { describe, expectTypeOf, it } from "vitest";

import type { DashboardStats, StatsFilter } from "./stats";

describe("statistics contracts", () => {
    it("keeps event and center filters plus dashboard metric groups typed", () => {
        expectTypeOf<StatsFilter>().toMatchTypeOf<{
            center_id?: number | null;
            event_id?: number | null;
        }>();
        expectTypeOf<DashboardStats>().toMatchTypeOf<{
            occupancy_stats: { current_occupancy: number; total_capacity: number };
            registration_stats: { total_registered: number };
            aid_distribution_stats: { total_distributed: number };
        }>();
    });
});
