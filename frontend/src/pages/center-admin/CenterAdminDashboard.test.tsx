import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import { useEventStore } from "@/store/eventStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { CenterAdminDashboard } from "./CenterAdminDashboard";

vi.mock("@/components/features/dashboard/EventDetailsModal", () => ({
    EventDetailsModal: () => null,
}));
vi.mock("@/components/features/dashboard/MapPanel", () => ({ MapPanel: () => <div /> }));
vi.mock("@/components/features/dashboard/StatsRow", () => ({ StatsRow: () => <div /> }));
vi.mock("@/components/features/dashboard/EventHistoryTable", () => ({
    EventHistoryTable: () => <div />,
}));
vi.mock("@/components/features/dashboard/ErrorAlert", () => ({ ErrorAlert: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("@/store/eventStore", () => ({ useEventStore: vi.fn() }));
vi.mock("@/store/evacuationCenterStore", () => ({ useEvacuationCenterStore: vi.fn() }));

describe("CenterAdminDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({ user: null });
        vi.mocked(useEventStore).mockReturnValue({
            events: [],
            loading: false,
            error: null,
            searchQuery: "",
            currentPage: 1,
            entriesPerPage: 10,
            sortConfig: null,
            pagination: null,
            setSearchQuery: vi.fn(),
            setCurrentPage: vi.fn(),
            setEntriesPerPage: vi.fn(),
            setSortConfig: vi.fn(),
            fetchEvents: vi.fn(),
            getEventDetails: vi.fn(),
        });
        vi.mocked(useEvacuationCenterStore).mockReturnValue({
            centers: [],
            mapCenters: [],
            loading: false,
            fetchAllCenters: vi.fn(),
        });
    });

    it("explains when the authenticated account has no assigned center", () => {
        render(<CenterAdminDashboard />);
        expect(screen.getByText("No center assigned to this account")).toBeInTheDocument();
    });
});
