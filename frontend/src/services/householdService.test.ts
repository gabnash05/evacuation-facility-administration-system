import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./api", () => ({
    api: { get },
    handleApiError: vi.fn(),
}));

import { HouseholdService } from "./householdService";

describe("HouseholdService", () => {
    beforeEach(() => {
        get.mockReset();
    });

    it("maps the documented household list response without speculative fallbacks", async () => {
        get.mockResolvedValue({
            data: {
                success: true,
                message: "Households fetched",
                data: [
                    {
                        household_id: 4,
                        household_name: "Santos household",
                        address: "Barangay One",
                        center_id: 2,
                        created_at: "2026-09-04T00:00:00Z",
                    },
                ],
                pagination: {
                    page: 2,
                    per_page: 20,
                    page_count: 3,
                    total_records: 41,
                },
            },
        });

        await expect(
            HouseholdService.getHouseholds({
                search: "Santos",
                page: 2,
                limit: 20,
                sortBy: "household_name",
                sortOrder: "desc",
                centerId: 2,
            })
        ).resolves.toMatchObject({
            success: true,
            data: {
                results: [{ household_id: 4 }],
                pagination: { current_page: 2, total_pages: 3, total_items: 41, limit: 20 },
            },
        });

        expect(get).toHaveBeenCalledWith("/households", {
            params: {
                search: "Santos",
                page: 2,
                per_page: 20,
                sort_by: "household_name",
                sort_order: "desc",
                center_id: 2,
            },
            withCredentials: true,
        });
    });
});
