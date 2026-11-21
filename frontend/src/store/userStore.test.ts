import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, getUsers } = vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    getUsers: vi.fn(),
}));

vi.mock("@/services/userService", () => ({
    UserService: { getCurrentUser, getUsers },
}));

import { useUserStore } from "./userStore";

describe("user store", () => {
    beforeEach(() => {
        useUserStore.getState().resetState();
        getCurrentUser.mockReset();
        getUsers.mockReset();
    });

    it("sends role, status, and center filters to the users API", async () => {
        getUsers.mockResolvedValue({
            data: {
                results: [],
                pagination: { current_page: 1, total_pages: 0, total_items: 0, limit: 10 },
            },
        });

        useUserStore.getState().setRoleFilter("volunteer");
        useUserStore.getState().setStatusFilter("inactive");
        await useUserStore.getState().fetchUsers(24);

        expect(getUsers).toHaveBeenCalledWith(
            expect.objectContaining({ centerId: 24, role: "volunteer", status: "inactive" })
        );
        expect(useUserStore.getState().currentPage).toBe(1);
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
