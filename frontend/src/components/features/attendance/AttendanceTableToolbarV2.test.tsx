import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttendanceTableToolbarV2 } from "./AttendanceTableToolbarV2";

const baseProps = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    onCheckIn: vi.fn(),
    onOpenCheckOut: vi.fn(),
    onOpenTransfer: vi.fn(),
    entriesPerPage: 10,
    onEntriesPerPageChange: vi.fn(),
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
    loading: false,
};

describe("AttendanceTableToolbarV2", () => {
    it("forwards search and workflow actions through named controls", () => {
        render(<AttendanceTableToolbarV2 {...baseProps} />);

        fireEvent.change(screen.getByRole("textbox", { name: "Search attendance records" }), {
            target: { value: "Ana" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Check In" }));
        fireEvent.click(screen.getByRole("button", { name: "Check Out" }));
        fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
        fireEvent.click(screen.getByRole("button", { name: "Filters" }));

        expect(baseProps.onSearchChange).toHaveBeenCalledWith("Ana");
        expect(baseProps.onCheckIn).toHaveBeenCalledOnce();
        expect(baseProps.onOpenCheckOut).toHaveBeenCalledOnce();
        expect(baseProps.onOpenTransfer).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute(
            "aria-expanded",
            "true"
        );
        expect(screen.getByRole("combobox", { name: "Entries per page" })).toBeInTheDocument();
    });

    it("disables search and attendance actions while loading", () => {
        render(<AttendanceTableToolbarV2 {...baseProps} loading />);

        expect(screen.getByRole("textbox", { name: "Search attendance records" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Check In" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Check Out" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
    });
});
