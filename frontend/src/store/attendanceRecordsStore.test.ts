import { beforeEach, describe, expect, it, vi } from "vitest";

const { attendanceService } = vi.hoisted(() => ({
    attendanceService: { getAttendanceRecords: vi.fn() },
}));

vi.mock("@/services/attendanceRecordsService", () => ({
    AttendanceRecordsService: attendanceService,
}));
vi.mock("@/services/eventService", () => ({ EventService: { getActiveEvent: vi.fn() } }));

import { useAttendanceStore } from "./attendanceRecordsStore";

describe("useAttendanceStore", () => {
    beforeEach(() => {
        useAttendanceStore.getState().resetState();
        attendanceService.getAttendanceRecords.mockReset();
    });

    it("forwards the attendance page filters and table state to record retrieval", async () => {
        attendanceService.getAttendanceRecords.mockResolvedValue({
            success: true,
            data: {
                results: [{ record_id: 4, individual_id: 8 }],
                pagination: { current_page: 2, total_pages: 3, total_items: 22, limit: 25 },
            },
        });
        const store = useAttendanceStore.getState();
        store.setSearchQuery("Ana");
        store.setEntriesPerPage(25);
        store.setSortConfig({ key: "check_in_time", direction: "desc" });
        store.setAttendancePageFilters({ centerId: 7, eventId: 6, status: "checked_in" });
        store.setCurrentPage(2);

        await store.fetchAttendanceRecords({ household_id: 3 });

        expect(attendanceService.getAttendanceRecords).toHaveBeenCalledWith({
            household_id: 3,
            search: "Ana",
            page: 2,
            limit: 25,
            sortBy: "check_in_time",
            sortOrder: "desc",
            center_id: 7,
            individual_id: undefined,
            event_id: 6,
            status: "checked_in",
            date: undefined,
        });
        expect(useAttendanceStore.getState()).toMatchObject({
            attendanceRecords: [{ record_id: 4, individual_id: 8 }],
            pagination: { current_page: 2, total_pages: 3, total_items: 22, limit: 25 },
            loading: false,
            error: null,
        });
    });

    it("clears stale attendance records and pagination after retrieval fails", async () => {
        attendanceService.getAttendanceRecords.mockRejectedValue(new Error("offline"));
        useAttendanceStore.setState({
            attendanceRecords: [{ record_id: 4 } as any],
            pagination: { current_page: 1, total_pages: 1, total_items: 1, limit: 10 },
        });

        await useAttendanceStore.getState().fetchAttendanceRecords();

        expect(useAttendanceStore.getState()).toMatchObject({
            attendanceRecords: [],
            pagination: null,
            loading: false,
            error: "offline",
        });
    });
});
