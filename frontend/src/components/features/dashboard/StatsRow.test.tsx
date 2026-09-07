import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { statsStore, eventStore } = vi.hoisted(() => ({
    statsStore: vi.fn(),
    eventStore: vi.fn(),
}));

vi.mock("@/store/statsStore", () => ({ useStatsStore: statsStore }));
vi.mock("@/store/eventStore", () => ({ useEventStore: eventStore }));

import { StatsRow } from "./StatsRow";

describe("StatsRow", () => {
    it("loads center-scoped events and statistics, then resets active filters", async () => {
        const fetchEvents = vi.fn().mockResolvedValue(undefined);
        const fetchStats = vi.fn().mockResolvedValue(undefined);
        const resetFilters = vi.fn();
        statsStore.mockReturnValue({
            stats: {},
            loading: false,
            filters: { gender: "Male", age_group: null, event_id: 3 },
            setGenderFilter: vi.fn(),
            setAgeGroupFilter: vi.fn(),
            setEventFilter: vi.fn(),
            fetchStats,
            resetFilters,
            getStatsForDisplay: () => [
                { label: "Occupancy", value: 20, percentage: 40, max: 50 },
                { label: "Registered", value: 10, percentage: 20 },
                { label: "Aid", value: 5, percentage: 50 },
            ],
        });
        eventStore.mockReturnValue({ events: [], fetchEvents });

        render(<StatsRow centerId={8} />);

        await waitFor(() => {
            expect(fetchEvents).toHaveBeenCalledWith(8);
            expect(fetchStats).toHaveBeenCalledWith(8);
        });
        expect(screen.getByText("Occupancy")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /reset/i }));
        expect(resetFilters).toHaveBeenCalledOnce();
    });
});
