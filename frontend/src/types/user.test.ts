import { describe, expectTypeOf, it } from "vitest";

import type { AuthResponse, User, UserRole } from "./user";

describe("user contracts", () => {
    it("keeps the canonical API field names and supported roles stable", () => {
        expectTypeOf<User>().toMatchTypeOf<{
            user_id: number;
            email: string;
            role: UserRole;
            center_id?: number | null;
            is_active: boolean;
        }>();
        expectTypeOf<AuthResponse>().toMatchTypeOf<{ role: UserRole; token?: string }>();
    });
});
