import { describe, expect, it } from "vitest";

import { centerSearchSchema, eventSearchSchema, searchFilterSchema } from "./search";

describe("search filter schemas", () => {
    it("applies stable pagination defaults", () => {
        expect(searchFilterSchema.parse({})).toEqual({ page: 1, limit: 10 });
    });

    it("constrains center and event statuses to their documented lifecycles", () => {
        expect(centerSearchSchema.safeParse({ status: "closed" }).success).toBe(true);
        expect(eventSearchSchema.safeParse({ status: "monitoring" }).success).toBe(true);
        expect(centerSearchSchema.safeParse({ status: "monitoring" }).success).toBe(false);
        expect(eventSearchSchema.safeParse({ status: "closed" }).success).toBe(false);
    });
});
