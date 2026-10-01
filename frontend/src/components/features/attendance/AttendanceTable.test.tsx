import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttendanceTable } from "./AttendanceTable";

const headers = [
    { key: "individual_name", label: "Individual", sortable: true },
    { key: "status", label: "Status", sortable: false },
];
const record = {
    record_id: 4,
    individual_name: "Ana Santos",
    center_name: "North Center",
    event_name: "Flood Response",
    household_name: "Santos Family",
    status: "checked_in",
    check_in_time: "2026-09-10T08:00:00",
    check_out_time: "",
    transfer_time: "",
};

describe("AttendanceTable", () => {
    it("renders an explicit empty state", () => {
        render(
            <AttendanceTable
                data={[]}
                headers={headers}
                sortConfig={null}
                onSort={vi.fn()}
                onCheckOut={vi.fn()}
                onTransfer={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByText("No attendance records found.")).toBeInTheDocument();
    });

    it("forwards checked-in actions for allowed roles and names the menu", () => {
        const onSort = vi.fn();
        const onCheckOut = vi.fn();
        const onTransfer = vi.fn();
        render(
            <AttendanceTable
                data={[record]}
                headers={headers}
                sortConfig={null}
                onSort={onSort}
                onCheckOut={onCheckOut}
                onTransfer={onTransfer}
                onDelete={vi.fn()}
                userRole="center_admin"
            />
        );

        fireEvent.click(screen.getByText("Individual"));
        fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Ana Santos" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Check Out" }));
        fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Ana Santos" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Transfer" }));

        expect(onSort).toHaveBeenCalledWith("individual_name");
        expect(onCheckOut).toHaveBeenCalledWith(4);
        expect(onTransfer).toHaveBeenCalledWith(4);
        expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    });
});
