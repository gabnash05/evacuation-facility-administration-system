import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadModal() {
    vi.resetModules();
    vi.doMock("@/store/attendanceRecordsStore", () => ({
        useAttendanceStore: () => ({
            currentAttendees: [],
            fetchCurrentAttendees: vi.fn(),
            fetchIndividualAttendanceHistory: vi.fn(),
            loading: false,
        }),
    }));
    vi.doMock("@/store/evacuationCenterStore", () => ({
        useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters: vi.fn(), loading: false }),
    }));
    vi.doMock("@/store/individualStore", () => ({
        useIndividualStore: () => ({ clearSearch: vi.fn(), fetchIndividualById: vi.fn() }),
    }));
    vi.doMock("@/store/eventStore", () => ({
        useEventStore: () => ({ activeEvent: null, fetchActiveEvent: vi.fn() }),
    }));
    vi.doMock("@/components/features/attendance/IndividualSearchTable", () => ({
        IndividualSearchTable: () => <div />,
    }));
    vi.doMock("@/components/features/transfer/EvacuationCentersList", () => ({
        EvacuationCentersList: () => <div />,
    }));
    vi.doMock("@/components/features/transfer/TransferReasonSelect", () => ({
        TransferReasonSelect: () => <div />,
    }));
    return import("./TransferIndividualModal");
}

afterEach(() => {
    vi.doUnmock("@/store/attendanceRecordsStore");
    vi.doUnmock("@/store/evacuationCenterStore");
    vi.doUnmock("@/store/individualStore");
    vi.doUnmock("@/store/eventStore");
    vi.doUnmock("@/components/features/attendance/IndividualSearchTable");
    vi.doUnmock("@/components/features/transfer/EvacuationCentersList");
    vi.doUnmock("@/components/features/transfer/TransferReasonSelect");
    vi.resetModules();
});

describe("TransferIndividualModal", () => {
    it("describes the transfer workflow and prevents empty submissions", async () => {
        const { TransferIndividualModal } = await loadModal();
        render(<TransferIndividualModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
        expect(screen.getByRole("dialog", { name: "Transfer Individual" })).toHaveTextContent(
            "Select checked-in individuals"
        );
        expect(screen.getByRole("button", { name: "✓ Transfer 0 Individuals" })).toBeDisabled();
    });
});
