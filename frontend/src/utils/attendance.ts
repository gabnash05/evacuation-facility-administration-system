import type { AttendanceRecord } from "@/types/attendance";

/**
 * Returns the current record that may be checked out or transferred for an
 * individual. Attendance history can contain completed stays, so callers must
 * never treat an individual identifier as an attendance-record identifier.
 */
export function getActiveAttendanceRecord(
    records: AttendanceRecord[],
    individualId: number
): AttendanceRecord | undefined {
    return records.find(
        record =>
            record.individual_id === individualId &&
            record.status === "checked_in" &&
            record.check_out_time === null
    );
}
