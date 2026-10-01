import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, handleApiError, defaults } = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    handleApiError: vi.fn(),
    defaults: { headers: { common: {} as Record<string, string> } },
}));

vi.mock("./api", () => ({ api: { get, post, defaults }, handleApiError }));

import { AuthService } from "./authService";

describe("AuthService", () => {
    beforeEach(() => {
        get.mockReset();
        post.mockReset();
        handleApiError.mockReset();
        defaults.headers.common = {};
    });

    it("returns the login contract and configures authorization only when the server supplies a token", async () => {
        post.mockResolvedValue({ data: { data: { role: "volunteer", token: "token-1" } } });

        await expect(
            AuthService.login({ email: "volunteer@example.com", password: "secret" })
        ).resolves.toEqual({ role: "volunteer", token: "token-1" });
        expect(post).toHaveBeenCalledWith(
            "/auth/login",
            { email: "volunteer@example.com", password: "secret" },
            { withCredentials: true }
        );
        expect(defaults.headers.common.Authorization).toBe("Bearer token-1");
    });
});
