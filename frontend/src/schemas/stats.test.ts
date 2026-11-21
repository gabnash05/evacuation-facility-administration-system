import { describe, expect, it } from "vitest";

import { StatsFilterSchema } from "./stats";

describe("statistics filter schema", () => {
    it("accepts the event filter propagated by the stats store and client", () => {
        expect(StatsFilterSchema.parse({ event_id: 7 }).event_id).toBe(7);
    });

    it("rejects non-positive event identifiers consistently with the backend", () => {
        expect(StatsFilterSchema.safeParse({ event_id: 0 }).success).toBe(false);
    });
});
