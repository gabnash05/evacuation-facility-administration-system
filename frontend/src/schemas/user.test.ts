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

    it("enforces center assignment invariants for roles", () => {
        expect(
            createUserSchema.safeParse({
                email: "center@example.test",
                password: "secret123",
                role: "center_admin",
            }).success
        ).toBe(false);
        expect(
            createUserSchema.safeParse({
                email: "city@example.test",
                password: "secret123",
                role: "city_admin",
                center_id: 2,
            }).success
        ).toBe(false);
    });

    it("allows partial user updates while rejecting invalid email addresses", () => {
        expect(updateUserSchema.parse({ is_active: false, password: "newsecret" })).toEqual({
            is_active: false,
            password: "newsecret",
        });
        expect(updateUserSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    });
});
