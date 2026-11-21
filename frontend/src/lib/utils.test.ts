import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
    it("combines conditional class values and resolves conflicting Tailwind utilities", () => {
        expect(cn("px-2", false, ["text-sm", { "bg-blue-500": true }], "px-4")).toBe(
            "text-sm bg-blue-500 px-4"
        );
    });
});
