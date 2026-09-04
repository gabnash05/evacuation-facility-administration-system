import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventDetailsModal } from "./EventDetailsModal";

describe("EventDetailsModal", () => {
    it("does not log selected event data to the browser console", () => {
        const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

        render(
            <EventDetailsModal
                isOpen={false}
                onClose={() => undefined}
                eventData={{
                    event_id: 1,
                    event_name: "Flood response",
                    event_type: "flood",
                    date_declared: "2026-09-04",
                    status: "active",
                    evacuation_centers: [],
                }}
            />
        );

        expect(consoleLog).not.toHaveBeenCalled();
        consoleLog.mockRestore();
    });
});
