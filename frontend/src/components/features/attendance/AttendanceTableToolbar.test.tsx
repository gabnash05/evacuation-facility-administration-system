import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttendanceTableToolbar } from "./AttendanceTableToolbar";

describe("AttendanceTableToolbar", () => {
    it("forwards search and attendance workflow actions", () => {
        const onSearchChange = vi.fn();
        const onCheckIn = vi.fn();
        const onOpenCheckOut = vi.fn();
        const onOpenTransfer = vi.fn();
        render(
            <AttendanceTableToolbar
                searchQuery=""
                onSearchChange={onSearchChange}
                onCheckIn={onCheckIn}
                onOpenCheckOut={onOpenCheckOut}
                onOpenTransfer={onOpenTransfer}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                loading={false}
            />
        );

        fireEvent.change(screen.getByPlaceholderText("Search attendance records..."), {
            target: { value: "Ana" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Check In" }));
        fireEvent.click(screen.getByRole("button", { name: "Check Out" }));
        fireEvent.click(screen.getByRole("button", { name: "Transfer" }));

        expect(onSearchChange).toHaveBeenCalledWith("Ana");
        expect(onCheckIn).toHaveBeenCalledOnce();
        expect(onOpenCheckOut).toHaveBeenCalledOnce();
        expect(onOpenTransfer).toHaveBeenCalledOnce();
    });

    it("locks search and workflow actions while loading", () => {
        render(
            <AttendanceTableToolbar
                searchQuery=""
                onSearchChange={vi.fn()}
                onCheckIn={vi.fn()}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                loading
            />
        );

        expect(screen.getByPlaceholderText("Search attendance records...")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Check In" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Check Out" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
    });
});
