import { describe, expect, it } from "vitest";

import { centerSearchSchema, loginSchema } from "./index";

describe("schema public exports", () => {
    it("exports authentication and search schemas through the canonical entry point", () => {
        expect(
            loginSchema.safeParse({ email: "user@example.com", password: "password" }).success
        ).toBe(true);
        expect(centerSearchSchema.safeParse({ page: 1, limit: 10 }).success).toBe(true);
    });
});
