import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/features/events/EventsTable", () => ({
    EventsTable: () => <div data-testid="events-table" />,
}));

import { EventHistoryTable } from "./EventHistoryTable";

const event = {
    event_id: 3,
    event_name: "Flood Response",
    status: "active",
} as never;

describe("EventHistoryTable", () => {
    it("blocks a new event while an active event exists and keeps pagination bounded", () => {
        const onAddEvent = vi.fn();
        const onPageChange = vi.fn();

        render(
            <EventHistoryTable
                paginatedData={[event]}
                processedData={[event]}
                searchQuery=""
                onSearchChange={vi.fn()}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                currentPage={1}
                onPageChange={onPageChange}
                totalPages={1}
                isLoadingEvents={false}
                onRowClick={vi.fn()}
                onSort={vi.fn()}
                sortConfig={null}
                onAddEvent={onAddEvent}
                activeEvent={event}
            />
        );

        expect(screen.getByText(/Active Event: Flood Response/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /add event/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
        expect(onPageChange).not.toHaveBeenCalled();
        expect(onAddEvent).not.toHaveBeenCalled();
    });

    it("renders an explicit empty state", () => {
        render(
            <EventHistoryTable
                paginatedData={[]}
                processedData={[]}
                searchQuery=""
                onSearchChange={vi.fn()}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                currentPage={1}
                onPageChange={vi.fn()}
                totalPages={1}
                isLoadingEvents={false}
                onRowClick={vi.fn()}
                onSort={vi.fn()}
                sortConfig={null}
            />
        );

        expect(screen.getByText("No events found")).toBeInTheDocument();
    });
});
