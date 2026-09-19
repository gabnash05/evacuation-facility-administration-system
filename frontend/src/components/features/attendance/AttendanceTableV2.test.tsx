import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AttendanceTableV2 from "./AttendanceTableV2";

const headers = [
    { key: "individual_name", label: "Individual", sortable: true },
    { key: "status", label: "Status", sortable: false },
];

const data = [
    {
        record_id: 4,
        individual_id: 9,
        individual_name: "Ana Santos",
        full_name: "Ana Santos",
        age: 24,
        gender: "Female",
        relationship_to_head: "Daughter",
        current_status: "checked_in",
        status: "checked_in",
        center_name: "Central Center",
        current_center_name: "Central Center",
        household_name: "Santos Household",
        last_check_in_time: "2026-01-01T08:00:00Z",
        can_check_out: true,
        can_transfer: true,
    },
];

describe("AttendanceTableV2", () => {
    it("exposes sortable headers and names each record action menu", () => {
        const onSort = vi.fn();
        const onCheckOut = vi.fn();
        render(
            <AttendanceTableV2
                data={data}
                headers={headers}
                sortConfig={{ key: "individual_name", direction: "asc" }}
                onSort={onSort}
                onCheckOut={onCheckOut}
                onTransfer={vi.fn()}
                onDelete={vi.fn()}
                userRole="center_admin"
            />
        );

        expect(screen.getByRole("columnheader", { name: "Individual" })).toHaveAttribute(
            "aria-sort",
            "ascending"
        );
        fireEvent.click(screen.getByRole("button", { name: "Individual" }));
        expect(onSort).toHaveBeenCalledWith("individual_name");

        fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Ana Santos" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Check Out" }));
        expect(onCheckOut).toHaveBeenCalledWith(4);
    });
});
