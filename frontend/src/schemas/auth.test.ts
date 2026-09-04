import { describe, expect, it } from "vitest";

import { loginSchema } from "./auth";

describe("loginSchema", () => {
    it("accepts a non-empty password paired with a valid email address", () => {
        expect(
            loginSchema.safeParse({ email: "volunteer@example.com", password: "secret" }).success
        ).toBe(true);
    });

    it("rejects malformed email addresses and empty passwords before an authentication request", () => {
        expect(loginSchema.safeParse({ email: "invalid", password: "secret" }).success).toBe(false);
        expect(
            loginSchema.safeParse({ email: "volunteer@example.com", password: "" }).success
        ).toBe(false);
    });
});
