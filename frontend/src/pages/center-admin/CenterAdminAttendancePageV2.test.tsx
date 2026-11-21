import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CenterAdminAttendancePage } from "./CenterAdminAttendancePageV2";

const { fetchIndividualAttendanceHistory, noop } = vi.hoisted(() => ({
    fetchIndividualAttendanceHistory: vi.fn(),
    noop: vi.fn(),
}));

vi.mock("@/store/authStore", () => ({
    useAuthStore: () => ({ user: { role: "center_admin", center_id: 2 } }),
}));
vi.mock("@/store/attendanceRecordsStore", () => ({
    useAttendanceStore: () => ({ fetchIndividualAttendanceHistory }),
}));
vi.mock("@/store/individualStore", () => ({
    useIndividualStore: () => ({
        paginatedIndividuals: [
            {
                individual_id: 7,
                first_name: "Pat",
                last_name: "Example",
                household_id: 5,
                current_center_id: 2,
                current_status: "checked_in",
            },
        ],
        currentPage: 1,
        entriesPerPage: 10,
        totalRecords: 1,
        fetchIndividuals: noop,
        setFilter: noop,
    }),
}));
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters: noop }),
}));
vi.mock("@/store/eventStore", () => ({ useEventStore: () => ({ fetchActiveEvent: noop }) }));
vi.mock("@/components/features/attendance/AttendanceTableToolbarV2", () => ({
    AttendanceTableToolbarV2: () => null,
}));
vi.mock("@/components/features/attendance/AttendanceTableV2", () => ({
    AttendanceTable: ({
        data,
        onCheckOut,
    }: {
        data: { record_id: number }[];
        onCheckOut: (id: number) => void;
    }) => (
        <button type="button" onClick={() => onCheckOut(data[0].record_id)}>
            Check out selected individual
        </button>
    ),
}));
vi.mock("@/components/features/attendance/CheckInModal", () => ({ CheckInModal: () => null }));
vi.mock("@/components/features/transfer/TransferIndividualModal", () => ({
    TransferIndividualModal: () => null,
}));
vi.mock("@/components/features/attendance/CheckOutModal", () => ({
    CheckOutModal: ({ isOpen, recordId }: { isOpen: boolean; recordId: number | null }) =>
        isOpen ? <p>Checkout record {recordId}</p> : null,
}));

describe("CenterAdminAttendancePageV2", () => {
    it("opens checkout with the active attendance record ID", async () => {
        fetchIndividualAttendanceHistory.mockResolvedValueOnce([
            {
                individual_id: 7,
                record_id: 31,
                status: "checked_out",
                check_out_time: "2026-01-01",
            },
            { individual_id: 7, record_id: 41, status: "checked_in", check_out_time: null },
        ]);
        render(<CenterAdminAttendancePage />);

        fireEvent.click(screen.getByRole("button", { name: "Check out selected individual" }));

        expect(fetchIndividualAttendanceHistory).toHaveBeenCalledExactlyOnceWith(7);
        expect(await screen.findByText("Checkout record 41")).toBeInTheDocument();
    });
});
