import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("./api", () => ({ api: { get, post }, handleApiError: vi.fn(error => error.message) }));

import { AttendanceRecordsService } from "./attendanceRecordsService";

describe("AttendanceRecordsService", () => {
    beforeEach(() => {
        get.mockReset();
        post.mockReset();
    });

    it("uses supported center status and center-events endpoints before check-in", async () => {
        get.mockResolvedValueOnce({ data: { data: { center_id: 2, status: "active" } } });
        get.mockResolvedValueOnce({
            data: { data: [{ event_id: 9, event_name: "Flood", status: "active" }] },
        });
        get.mockResolvedValueOnce({
            data: { data: [{ event_id: 9, event_name: "Flood", status: "active" }] },
        });
        post.mockResolvedValue({ data: { success: true, data: {}, message: "Checked in" } });

        await AttendanceRecordsService.checkInIndividual({
            individual_id: 1,
            center_id: 2,
            event_id: 0,
            household_id: 3,
        });

        expect(get).toHaveBeenNthCalledWith(1, "/evacuation_centers/2/status", {
            withCredentials: true,
        });
        expect(get).toHaveBeenNthCalledWith(2, "/evacuation_centers/2/events", {
            withCredentials: true,
        });
        expect(post).toHaveBeenCalledWith(
            "/attendance/check-in",
            expect.objectContaining({ event_id: 9 }),
            { withCredentials: true }
        );
    });

    it("rejects mixed-center batch check-ins before making network calls", async () => {
        await expect(
            AttendanceRecordsService.checkInMultipleIndividuals([
                { individual_id: 1, center_id: 2, event_id: 1, household_id: 3 },
                { individual_id: 2, center_id: 4, event_id: 1, household_id: 5 },
            ])
        ).rejects.toThrow("Batch check-ins must target the same center");

        expect(get).not.toHaveBeenCalled();
        expect(post).not.toHaveBeenCalled();
    });
});
