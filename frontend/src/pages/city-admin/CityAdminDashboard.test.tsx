import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useEventStore } from "@/store/eventStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { CityAdminDashboard } from "./CityAdminDashboard";

vi.mock("@/components/features/dashboard/EventDetailsModal", () => ({
    EventDetailsModal: () => null,
}));
vi.mock("@/components/features/dashboard/MapPanel", () => ({ MapPanel: () => <div /> }));
vi.mock("@/components/features/dashboard/StatsRow", () => ({ StatsRow: () => <div /> }));
vi.mock("@/components/features/dashboard/EventHistoryTable", () => ({
    EventHistoryTable: () => <div />,
}));
vi.mock("@/components/features/dashboard/ErrorAlert", () => ({ ErrorAlert: () => null }));
vi.mock("@/components/features/events/CreateEventModal", () => ({ CreateEventModal: () => null }));
vi.mock("@/components/features/events/ResolveEventModal", () => ({
    ResolveEventModal: () => null,
}));
vi.mock("@/components/features/events/DeleteEventDialog", () => ({
    DeleteEventDialog: () => null,
}));
vi.mock("@/components/features/evacuation-center/SuccessToast", () => ({
    SuccessToast: () => null,
}));
vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/eventStore", () => ({ useEventStore: vi.fn() }));
vi.mock("@/store/evacuationCenterStore", () => ({ useEvacuationCenterStore: vi.fn() }));

const eventStore = {
    events: [],
    activeEvent: null,
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
    fetchActiveEvent: vi.fn(),
    getEventDetails: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    validateEventCreation: vi.fn(),
};

describe("CityAdminDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "city_admin" } });
        vi.mocked(useEventStore).mockReturnValue(eventStore);
        vi.mocked(useEvacuationCenterStore).mockReturnValue({
            centers: [],
            mapCenters: [],
            loading: false,
            citySummary: null,
            fetchAllCenters: vi.fn(),
            fetchCitySummary: vi.fn(),
        });
    });

    it("fetches events once for the initial dashboard state", async () => {
        render(<CityAdminDashboard />);
        await waitFor(() => expect(eventStore.fetchEvents).toHaveBeenCalledOnce());
    });
});
