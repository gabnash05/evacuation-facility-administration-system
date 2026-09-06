import { describe, expectTypeOf, it } from "vitest";

import type { Allocation, CreateAllocationForm } from "./allocation";

describe("allocation display contracts", () => {
    it("keeps center-bound allocation and form fields typed", () => {
        expectTypeOf<Allocation>().toMatchTypeOf<{
            allocation_id: number;
            center_id: number;
            remaining_quantity: number;
        }>();
        expectTypeOf<CreateAllocationForm>().toMatchTypeOf<{
            center_id: string;
            category_id: string;
            distribution_type: "per_household" | "per_individual";
        }>();
    });
});
