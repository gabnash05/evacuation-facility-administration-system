import { describe, expectTypeOf, it } from "vitest";

import type { AttendanceRecord, AttendanceStatus, GetAttendanceParams } from "./attendance";

describe("attendance contracts", () => {
    it("keeps attendance record identity distinct from individual identity", () => {
        expectTypeOf<AttendanceRecord>().toMatchTypeOf<{
            record_id: number;
            individual_id: number;
            center_id: number;
            event_id: number;
        }>();
        expectTypeOf<AttendanceStatus>().toEqualTypeOf<
            "checked_in" | "checked_out" | "transferred"
        >();
        expectTypeOf<GetAttendanceParams>().toMatchTypeOf<{
            center_id?: number;
            event_id?: number;
            status?: AttendanceStatus;
        }>();
    });
});
