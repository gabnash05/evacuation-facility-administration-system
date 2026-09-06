import { describe, expectTypeOf, it } from "vitest";

import type { Allocation, DistributionRecord, HouseholdOption } from "./distribution";

describe("distribution contracts", () => {
    it("keeps the history identity, item, and status fields typed", () => {
        expectTypeOf<DistributionRecord>().toMatchTypeOf<{
            distribution_id: number;
            allocation_id: number;
            center_id: number;
            status: "completed" | "voided";
        }>();
        expectTypeOf<Allocation>().toMatchTypeOf<{
            allocation_id: number;
            status: "active" | "depleted" | "cancelled";
        }>();
        expectTypeOf<HouseholdOption>().toMatchTypeOf<{
            household_id: number;
            household_name: string;
        }>();
    });
});
