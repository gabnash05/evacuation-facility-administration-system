import { describe, expectTypeOf, it } from "vitest";

import type { EventDetails, EventStatus } from "./event";

describe("event contracts", () => {
    it("keeps event detail status and center associations constrained", () => {
        expectTypeOf<EventStatus>().toEqualTypeOf<"active" | "resolved" | "monitoring">();
        expectTypeOf<EventDetails>().toMatchTypeOf<{
            event_id: number;
            status: EventStatus;
            evacuation_centers: { center_id: number }[];
        }>();
    });
});
