import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvacuationCenter } from "@/types/center";
import type { Event } from "@/types/event";

const { getEventsByCenterId, fetchCurrentAttendees, setFilters, attendanceState } = vi.hoisted(
    () => ({
        getEventsByCenterId: vi.fn(),
        fetchCurrentAttendees: vi.fn(),
        setFilters: vi.fn(),
        attendanceState: { error: null as string | null },
    })
);

vi.mock("@/services/eventService", () => ({
    eventService: { getEventsByCenterId },
}));
vi.mock("@/store/attendanceRecordsStore", () => ({
    useAttendanceStore: () => ({
        currentAttendees: [],
        error: attendanceState.error,
        fetchCurrentAttendees,
        setFilters,
    }),
}));
vi.mock("../map/MonoMap", () => ({
    default: ({
        centers,
        center,
        zoom,
    }: {
        centers: unknown[];
        center: [number, number];
        zoom: number;
    }) => (
        <div
            data-testid="center-map"
            data-count={centers.length}
            data-coordinates={JSON.stringify(center)}
            data-zoom={zoom}
        />
    ),
}));

import { EvacuationCenterDetailsModal } from "./EvacuationCenterDetailsModal";

const center: EvacuationCenter = {
    center_id: 7,
    center_name: "North Center",
    address: "North Road",
    latitude: 0,
    longitude: 124,
    capacity: 100,
    current_occupancy: 20,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
};

describe("EvacuationCenterDetailsModal", () => {
    beforeEach(() => {
        getEventsByCenterId.mockReset().mockResolvedValue({ success: true, data: [] });
        fetchCurrentAttendees.mockReset().mockResolvedValue(undefined);
        setFilters.mockReset();
        attendanceState.error = null;
    });

    it("renders zero-valued coordinates and loads attendees only when selected", async () => {
        render(<EvacuationCenterDetailsModal isOpen center={center} onClose={vi.fn()} />);

        const dialog = screen.getByRole("dialog", { name: "Evacuation Center Details" });
        expect(dialog).toHaveTextContent(
            "Review this center's location, events, and current attendees."
        );
        expect(screen.getByTestId("center-map")).toHaveAttribute("data-count", "1");
        expect(screen.getByTestId("center-map")).toHaveAttribute("data-coordinates", "[0,124]");
        expect(screen.getByTestId("center-map")).toHaveAttribute("data-zoom", "15");
        expect(screen.queryByText("No location coordinates available")).not.toBeInTheDocument();
        await waitFor(() => expect(getEventsByCenterId).toHaveBeenCalledWith(7));
        expect(fetchCurrentAttendees).not.toHaveBeenCalled();

        fireEvent.mouseDown(screen.getByRole("tab", { name: "Attendance" }), { button: 0 });
        await waitFor(() => expect(fetchCurrentAttendees).toHaveBeenCalledWith({ center_id: 7 }));
        expect(setFilters).toHaveBeenCalledWith({ centerId: 7 });
    });

    it("announces event-loading failures", async () => {
        getEventsByCenterId.mockRejectedValue(new Error("Unavailable"));
        render(<EvacuationCenterDetailsModal isOpen center={center} onClose={vi.fn()} />);

        fireEvent.mouseDown(screen.getByRole("tab", { name: "Events" }), { button: 0 });
        expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load event history");
    });

    it("shows a current-attendee error retained by the store", async () => {
        fetchCurrentAttendees.mockImplementationOnce(async () => {
            attendanceState.error = "Attendance service unavailable";
        });
        const props = { isOpen: true, center, onClose: vi.fn() };
        const { rerender } = render(<EvacuationCenterDetailsModal {...props} />);

        fireEvent.mouseDown(screen.getByRole("tab", { name: "Attendance" }), { button: 0 });
        await waitFor(() => expect(fetchCurrentAttendees).toHaveBeenCalledWith({ center_id: 7 }));
        rerender(<EvacuationCenterDetailsModal {...props} />);
        expect(screen.getByRole("alert")).toHaveTextContent("Attendance service unavailable");
    });

    it("ignores a stale event response after switching centers", async () => {
        const requests = new Map<number, (response: { success: boolean; data: Event[] }) => void>();
        getEventsByCenterId.mockImplementation(
            (id: number) =>
                new Promise(resolve => {
                    requests.set(id, resolve);
                })
        );
        const { rerender } = render(
            <EvacuationCenterDetailsModal isOpen center={center} onClose={vi.fn()} />
        );
        rerender(
            <EvacuationCenterDetailsModal
                isOpen
                center={{ ...center, center_id: 8, center_name: "South Center" }}
                onClose={vi.fn()}
            />
        );
        fireEvent.mouseDown(screen.getByRole("tab", { name: "Events" }), { button: 0 });

        const event = (event_id: number, event_name: string): Event => ({
            event_id,
            event_name,
            event_type: "Flood",
            date_declared: "2026-01-01",
            status: "active",
            capacity: 100,
            max_occupancy: 20,
            usage_percentage: 20,
        });
        await act(async () => {
            requests.get(8)?.({ success: true, data: [event(8, "New event")] });
        });
        expect(screen.getByText("New event")).toBeInTheDocument();

        await act(async () => {
            requests.get(7)?.({ success: true, data: [event(7, "Stale event")] });
        });
        expect(screen.getByText("New event")).toBeInTheDocument();
        expect(screen.queryByText("Stale event")).not.toBeInTheDocument();
    });
});
