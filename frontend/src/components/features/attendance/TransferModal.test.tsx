import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransferModal } from "./TransferModal";

const transferIndividual = vi.fn();
const fetchAllCenters = vi.fn();

vi.mock("@/store/attendanceRecordsStore", () => ({
    useAttendanceStore: () => ({ transferIndividual }),
}));

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({
        centers: [],
        fetchAllCenters,
        loading: false,
    }),
}));

describe("TransferModal", () => {
    it("describes its purpose and validates the selected record", async () => {
        render(<TransferModal isOpen recordId={null} onClose={vi.fn()} onSuccess={vi.fn()} />);

        expect(screen.getByRole("heading", { name: "Transfer Individual" })).toBeInTheDocument();
        expect(screen.getByText(/Move the selected individual/)).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Destination center" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Transfer" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "No attendance record selected."
        );
        await waitFor(() => expect(fetchAllCenters).toHaveBeenCalledOnce());
        expect(transferIndividual).not.toHaveBeenCalled();
    });
});
