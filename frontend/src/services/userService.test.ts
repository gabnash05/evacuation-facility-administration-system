import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, handleApiError } = vi.hoisted(() => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
    handleApiError: vi.fn(() => "normalized failure"),
}));

vi.mock("./api", () => ({ api, handleApiError }));

import { UserService } from "./userService";

describe("UserService", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
        api.delete.mockReset();
        api.patch.mockReset();
        handleApiError.mockClear();
    });

    it("forwards list filters with credentialed user requests", async () => {
        const response = { data: { success: true, data: { results: [], pagination: {} } } };
        api.get.mockResolvedValue(response);

        await expect(UserService.getUsers({ search: "ana", centerId: 4 })).resolves.toBe(
            response.data
        );

        expect(api.get).toHaveBeenCalledWith("/users", {
            params: { search: "ana", centerId: 4 },
            withCredentials: true,
        });
    });

    it("uses the correct role-management mutation endpoints", async () => {
        api.patch.mockResolvedValue({ data: { success: true } });

        await UserService.deactivateUser(12);
        await UserService.reactivateUser(12);

        expect(api.patch).toHaveBeenNthCalledWith(
            1,
            "/users/12/deactivate",
            {},
            {
                withCredentials: true,
            }
        );
        expect(api.patch).toHaveBeenNthCalledWith(
            2,
            "/users/12/reactivate",
            {},
            {
                withCredentials: true,
            }
        );
    });

    it("normalizes API failures before callers receive them", async () => {
        const failure = new Error("raw failure");
        api.delete.mockRejectedValue(failure);

        await expect(UserService.deleteUser(12)).rejects.toThrow("normalized failure");
        expect(handleApiError).toHaveBeenCalledWith(failure);
    });
});
