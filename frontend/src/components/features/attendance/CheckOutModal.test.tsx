import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckOutModal } from "./CheckOutModal";

const fetchAllCenters = vi.fn();

vi.mock("@/store/attendanceRecordsStore", () => ({
    useAttendanceStore: () => ({
        checkOutIndividual: vi.fn(),
        checkOutMultipleIndividuals: vi.fn(),
        fetchIndividualAttendanceHistory: vi.fn(),
    }),
}));

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters }),
}));

vi.mock("./IndividualSearchTable", () => ({
    IndividualSearchTable: () => <div data-testid="individual-search" />,
}));

describe("CheckOutModal", () => {
    it("describes and completes the single-record checkout workflow", async () => {
        const onCheckOut = vi.fn().mockResolvedValue(undefined);
        const onSuccess = vi.fn();
        const onClose = vi.fn();
        render(
            <CheckOutModal
                isOpen
                recordId={9}
                onClose={onClose}
                onSuccess={onSuccess}
                onCheckOut={onCheckOut}
            />
        );

        expect(screen.getByText(/Complete an individual or batch/)).toBeInTheDocument();
        fireEvent.change(screen.getByRole("textbox", { name: "Check-out notes" }), {
            target: { value: "Returned home" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Check Out" }));

        await waitFor(() => expect(onCheckOut).toHaveBeenCalledWith(9, { notes: "Returned home" }));
        expect(onSuccess).toHaveBeenCalledWith(1);
        expect(onClose).toHaveBeenCalledOnce();
        await waitFor(() => expect(fetchAllCenters).toHaveBeenCalledOnce());
    });
});
