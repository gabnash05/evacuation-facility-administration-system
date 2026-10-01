import { describe, expect, it } from "vitest";

import { formatCapacity } from "./formatters";

describe("formatCapacity", () => {
    it("formats ordinary capacity percentages", () => {
        expect(formatCapacity(25, 100)).toBe("25/100 (25%)");
    });

    it("uses a stable zero percentage when total capacity is zero", () => {
        expect(formatCapacity(0, 0)).toBe("0/0 (0%)");
    });
});
