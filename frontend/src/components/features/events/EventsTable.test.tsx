import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventsTable } from "./EventsTable";

const event = {
    event_id: 9,
    event_name: "Flood Response",
    event_type: "Flood",
    date_declared: "2026-09-01",
    end_date: null,
    capacity: 100,
    max_occupancy: 125,
    status: "active",
} as never;

describe("EventsTable", () => {
    it("renders an explicit empty state", () => {
        render(
            <EventsTable
                data={[]}
                sortConfig={null}
                onSort={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onRowClick={vi.fn()}
            />
        );
        expect(screen.getByText("No events found")).toBeInTheDocument();
    });

    it("forwards sort and row selection while preventing active-event edit/delete", () => {
        const onSort = vi.fn();
        const onRowClick = vi.fn();
        render(
            <EventsTable
                data={[event]}
                sortConfig={null}
                onSort={onSort}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onResolve={vi.fn()}
                onRowClick={onRowClick}
                userRole="super_admin"
                activeEventId={9}
            />
        );

        fireEvent.click(screen.getByText("Event Name"));
        fireEvent.click(screen.getByText("Flood Response"));
        fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

        expect(onSort).toHaveBeenCalledWith("event_name");
        expect(onRowClick).toHaveBeenCalledWith(event);
        expect(screen.getByRole("button", { name: "Resolve Event" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
        expect(screen.getByText("125%")).toBeInTheDocument();
    });
});
