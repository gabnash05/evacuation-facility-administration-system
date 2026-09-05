import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({ service: { getEvents: vi.fn() } }));
vi.mock("@/services/eventService", () => ({ EventService: service }));

import { useEventStore } from "./eventStore";

describe("useEventStore list refresh", () => {
    beforeEach(() => {
        useEventStore.getState().resetState();
        service.getEvents.mockReset();
    });

    it("uses the explicit center scope and clears stale list state on failure", async () => {
        service.getEvents.mockRejectedValue(new Error("offline"));
        useEventStore.setState({
            events: [{ event_id: 2 } as any],
            pagination: { current_page: 1, total_pages: 1, total_items: 1, limit: 10 },
        });
        const store = useEventStore.getState();
        store.setSearchQuery("flood");
        await store.fetchEvents(7);

        expect(service.getEvents).toHaveBeenCalledWith({
            search: "flood",
            page: 1,
            limit: 10,
            sortBy: undefined,
            sortOrder: undefined,
            center_id: 7,
        });
        expect(useEventStore.getState()).toMatchObject({
            events: [],
            pagination: null,
            loading: false,
            error: "offline",
        });
    });
});
