import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckInModal } from "./CheckInModal";

const fetchActiveEvent = vi.fn();
const fetchAllCenters = vi.fn();

vi.mock("@/store/attendanceRecordsStore", () => ({
    useAttendanceStore: () => ({
        checkInMultipleIndividuals: vi.fn(),
        validateAttendanceConditions: vi.fn(),
        attendanceValidation: null,
    }),
}));

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters, loading: false }),
}));

vi.mock("@/store/eventStore", () => ({
    useEventStore: () => ({ activeEvent: null, fetchActiveEvent, loading: false }),
}));

vi.mock("./IndividualSearchTable", () => ({
    IndividualSearchTable: () => <div data-testid="individual-search" />,
}));

describe("CheckInModal", () => {
    it("preselects an individual until an active event is available", async () => {
        render(
            <CheckInModal
                isOpen
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                defaultCenterId={3}
                individualToCheckIn={{
                    individual_id: 7,
                    first_name: "Ana",
                    last_name: "Santos",
                    relationship_to_head: "Daughter",
                    household_id: 5,
                    current_status: "checked_out",
                    created_at: "2026-01-01T00:00:00Z",
                    updated_at: "2026-01-01T00:00:00Z",
                }}
            />
        );

        expect(screen.getByText(/Select individuals and an evacuation center/)).toBeInTheDocument();
        expect(screen.getByText("Ana Santos")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Remove Ana Santos" })).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Evacuation center" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Check In 1 Individual" })).toBeDisabled();
        expect(screen.getByTestId("individual-search")).toBeInTheDocument();
        await waitFor(() => expect(fetchActiveEvent).toHaveBeenCalledOnce());
        expect(fetchAllCenters).not.toHaveBeenCalled();
    });
});
