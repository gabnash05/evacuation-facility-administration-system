import { beforeEach, describe, expect, it, vi } from "vitest";

const { authService, resetState } = vi.hoisted(() => ({
    authService: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
    },
    resetState: vi.fn(),
}));

vi.mock("@/services/authService", () => ({ AuthService: authService }));

vi.mock("./attendanceRecordsStore", () => ({
    useAttendanceStore: { getState: () => ({ resetState }) },
}));
vi.mock("./individualStore", () => ({ useIndividualStore: { getState: () => ({ resetState }) } }));
vi.mock("./evacuationCenterStore", () => ({
    useEvacuationCenterStore: { getState: () => ({ resetState }) },
}));
vi.mock("./userStore", () => ({ useUserStore: { getState: () => ({ resetState }) } }));
vi.mock("./eventStore", () => ({ useEventStore: { getState: () => ({ resetState }) } }));
vi.mock("./householdStore", () => ({ useHouseholdStore: { getState: () => ({ resetState }) } }));
vi.mock("./aidAllocationStore", () => ({
    useAidAllocationStore: { getState: () => ({ resetState }) },
}));
vi.mock("./distributionStore", () => ({
    useDistributionStore: { getState: () => ({ resetState }) },
}));

import { useAuthStore } from "./authStore";

const user = {
    user_id: 12,
    email: "admin@example.test",
    role: "city_admin" as const,
    center_id: null,
    is_active: true,
};

describe("useAuthStore", () => {
    beforeEach(() => {
        window.localStorage.clear();
        resetState.mockClear();
        useAuthStore.getState().resetState();
    });

    it("stores the server-resolved user only after a successful login", async () => {
        authService.login.mockResolvedValue({ role: "city_admin", token: "opaque-token" });
        authService.getCurrentUser.mockResolvedValue(user);

        await expect(
            useAuthStore.getState().login({ email: user.email, password: "valid-password" })
        ).resolves.toEqual({ role: "city_admin", token: "opaque-token" });

        expect(authService.login).toHaveBeenCalledWith({
            email: user.email,
            password: "valid-password",
        });
        expect(useAuthStore.getState()).toMatchObject({
            user,
            isAuthenticated: true,
            isLoading: false,
        });
    });

    it("does not authenticate when resolving the server user fails after login", async () => {
        authService.login.mockResolvedValue({ role: "city_admin" });
        authService.getCurrentUser.mockRejectedValue(new Error("session unavailable"));

        await expect(
            useAuthStore.getState().login({ email: user.email, password: "valid-password" })
        ).rejects.toThrow("session unavailable");

        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    it("clears stale authentication when a server-side identity check fails", async () => {
        useAuthStore.getState().setUser(user);
        authService.getCurrentUser.mockRejectedValue(new Error("expired session"));

        await expect(useAuthStore.getState().checkAuth()).resolves.toBe(false);

        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    it("clears authentication and dependent stores after logout", async () => {
        useAuthStore.getState().setUser(user);
        authService.logout.mockResolvedValue(undefined);

        await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();

        expect(resetState).toHaveBeenCalledTimes(8);
        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            isAuthenticated: false,
            isLoggingOut: false,
        });
    });

    it("clears local state even when the logout request fails", async () => {
        useAuthStore.getState().setUser(user);
        authService.logout.mockRejectedValue(new Error("network unavailable"));
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(useAuthStore.getState().logout()).rejects.toThrow("network unavailable");

        expect(resetState).toHaveBeenCalledTimes(8);
        expect(useAuthStore.getState()).toMatchObject({
            user: null,
            isAuthenticated: false,
            isLoggingOut: false,
        });
    });
});
