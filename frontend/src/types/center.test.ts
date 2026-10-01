import { describe, expectTypeOf, it } from "vitest";

import type { CenterStatus, EvacuationCenter } from "./center";

describe("evacuation center contracts", () => {
    it("keeps canonical identifiers, capacity fields, and statuses stable", () => {
        expectTypeOf<EvacuationCenter>().toMatchTypeOf<{
            center_id: number;
            center_name: string;
            capacity: number;
            current_occupancy: number;
            status: CenterStatus;
        }>();
        expectTypeOf<CenterStatus>().toEqualTypeOf<"active" | "inactive" | "closed">();
    });
});
