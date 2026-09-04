import { describe, expect, it } from "vitest";

import type { AttendanceRecord } from "@/types/attendance";
import { getActiveAttendanceRecord } from "./attendance";

const record = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
    record_id: 41,
    individual_id: 7,
    center_id: 2,
    event_id: 3,
    household_id: 5,
    status: "checked_in",
    check_in_time: "2026-01-01T08:00:00Z",
    check_out_time: null,
    transfer_time: null,
    notes: undefined,
    ...overrides,
});

describe("getActiveAttendanceRecord", () => {
    it("selects the checked-in record for the requested individual", () => {
        const activeRecord = record();

        expect(
            getActiveAttendanceRecord(
                [
                    record({
                        record_id: 20,
                        status: "checked_out",
                        check_out_time: "2026-01-01T10:00:00Z",
                    }),
                    activeRecord,
                ],
                7
            )
        ).toBe(activeRecord);
    });

    it("does not substitute an individual id or a completed record for an active record", () => {
        expect(
            getActiveAttendanceRecord(
                [
                    record({
                        individual_id: 7,
                        status: "transferred",
                        transfer_time: "2026-01-01T10:00:00Z",
                    }),
                    record({ individual_id: 8 }),
                ],
                7
            )
        ).toBeUndefined();
    });
});
