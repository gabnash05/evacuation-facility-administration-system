import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
    state: {
        user: null as { role: string; center_id?: number | null } | null,
        isLoading: false,
        isAuthenticated: false,
        isLoggingOut: false,
        checkAuth: vi.fn(),
        hasRole: vi.fn(),
        clearAuth: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock("@/store/authStore", () => ({ useAuthStore: () => state }));

import { useAuth } from "./useAuth";

describe("useAuth", () => {
    beforeEach(() => {
        state.user = { role: "center_admin", center_id: 7 };
    });

    it("uses the canonical center_id contract for lower-role center access", () => {
        const { result } = renderHook(() => useAuth());

        expect(result.current.canAccessCenter(7)).toBe(true);
        expect(result.current.canAccessCenter(8)).toBe(false);
    });
});
