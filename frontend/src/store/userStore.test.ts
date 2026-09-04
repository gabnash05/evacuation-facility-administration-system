import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/services/userService", () => ({
    UserService: { getCurrentUser },
}));

import { useUserStore } from "./userStore";

describe("user store", () => {
    beforeEach(() => {
        useUserStore.setState({ currentUser: null, error: null, loading: false });
        getCurrentUser.mockReset();
    });

    it("refreshes the current user without logging the authenticated response", async () => {
        getCurrentUser.mockResolvedValue({
            data: { user_id: 1, email: "admin@example.test", role: "city_admin" },
        });
        const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

        await useUserStore.getState().fetchCurrentUser();

        expect(useUserStore.getState().currentUser).toMatchObject({
            email: "admin@example.test",
            role: "city_admin",
        });
        expect(consoleLog).not.toHaveBeenCalled();
        consoleLog.mockRestore();
    });
});
