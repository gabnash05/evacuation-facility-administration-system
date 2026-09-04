import { describe, expect, expectTypeOf, it } from "vitest";

import { handleApiError } from "./api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

describe("handleApiError", () => {
    it("preserves the backend message when one is provided", () => {
        expect(
            handleApiError({ response: { status: 422, data: { message: "Invalid household" } } })
        ).toBe("Invalid household");
    });

    it("uses a stable status fallback and a network fallback", () => {
        expect(handleApiError({ response: { status: 404, data: {} } })).toBe(
            "The requested resource was not found."
        );
        expect(handleApiError({})).toBe(
            "Unable to connect to server. Please check your internet connection."
        );
    });

    it("keeps API response and pagination types aligned with client consumers", () => {
        expectTypeOf<ApiResponse<{ id: number }>>().toMatchTypeOf<{
            success: boolean;
            message: string;
            data?: { id: number };
        }>();
        expectTypeOf<PaginatedResponse<{ id: number }>>().toMatchTypeOf<{
            data: { results: { id: number }[] };
        }>();
    });
});
