import { describe, expect, it } from "vitest";

import { createEventSchema, linkCenterToEventSchema } from "./events";

describe("event schemas", () => {
    it("defaults a valid event to active and retains the declared lifecycle status contract", () => {
        const data = createEventSchema.parse({
            event_name: "Flood response",
            event_type: "flood",
            date_declared: "2026-09-04",
        });

        expect(data.status).toBe("active");
        expect(createEventSchema.safeParse({ ...data, status: "monitoring" }).success).toBe(true);
        expect(createEventSchema.safeParse({ ...data, status: "resolved" }).success).toBe(true);
    });

    it("requires a positive center identifier when linking a center", () => {
        expect(linkCenterToEventSchema.safeParse({ center_id: 0 }).success).toBe(false);
        expect(linkCenterToEventSchema.parse({ center_id: 1 }).center_id).toBe(1);
    });
});
