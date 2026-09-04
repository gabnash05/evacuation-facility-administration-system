import { describe, expect, it } from "vitest";

import { createUserSchema, updateUserSchema } from "./user";

describe("user schemas", () => {
    it("accepts a valid user-management creation payload", () => {
        expect(
            createUserSchema.parse({
                email: "volunteer@example.test",
                password: "secret123",
                role: "volunteer",
                center_id: 2,
            })
        ).toMatchObject({ role: "volunteer", center_id: 2 });
    });

    it("allows partial user updates while rejecting invalid email addresses", () => {
        expect(updateUserSchema.parse({ is_active: false })).toEqual({ is_active: false });
        expect(updateUserSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    });
});
