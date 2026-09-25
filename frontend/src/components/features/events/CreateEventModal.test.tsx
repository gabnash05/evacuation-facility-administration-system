import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadModal() {
    vi.resetModules();
    vi.doMock("@/store/eventStore", () => ({
        useEventStore: () => ({ createEvent: vi.fn(), updateEvent: vi.fn(), loading: false }),
    }));
    return import("./CreateEventModal");
}

afterEach(() => {
    vi.doUnmock("@/store/eventStore");
    vi.resetModules();
});

describe("CreateEventModal", () => {
    it("describes event creation and names its primary controls", async () => {
        const { CreateEventModal } = await loadModal();

        render(<CreateEventModal isOpen onClose={vi.fn()} />);

        expect(screen.getByRole("dialog", { name: "Create Event" })).toHaveTextContent(
            "Create an event and associate affected centers."
        );
        expect(screen.getByLabelText("Event Name")).toBeEnabled();
        expect(screen.getByRole("combobox", { name: "Event type" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Date declared" })).toBeEnabled();
    });
});
