import { describe, expectTypeOf, it } from "vitest";

import type { EventCenter } from "./event-center";

describe("event-center contracts", () => {
    it("uses the application event model rather than the browser Event global", () => {
        expectTypeOf<EventCenter>().toMatchTypeOf<{
            eventId: number;
            centerId: number;
            event?: { event_id: number; event_name: string };
            center?: { center_id: number };
        }>();
    });
});
