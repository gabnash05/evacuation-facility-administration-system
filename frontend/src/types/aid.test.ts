import { describe, expectTypeOf, it } from "vitest";

import type { Allocation, DistributionStatus, UpdateAllocationData } from "./aid";

describe("aid contracts", () => {
    it("keeps allocation inventory and update fields constrained", () => {
        expectTypeOf<DistributionStatus>().toEqualTypeOf<"delivered" | "pending">();
        expectTypeOf<Allocation>().toMatchTypeOf<{
            allocation_id: number;
            center_id: number;
            event_id: number;
            remaining_quantity: number;
        }>();
        expectTypeOf<UpdateAllocationData>().toMatchTypeOf<{ total_quantity?: number }>();
    });
});
