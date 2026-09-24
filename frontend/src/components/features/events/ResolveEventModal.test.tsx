import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResolveEventModal } from "./ResolveEventModal";

describe("ResolveEventModal", () => {
    it("describes the resolution workflow and resets through cancellation", () => {
        const onClose = vi.fn();

        render(
            <ResolveEventModal
                isOpen
                onClose={onClose}
                event={{
                    event_id: 14,
                    event_name: "Flood response",
                    event_type: "Flood",
                    date_declared: "2026-09-01",
                    status: "active",
                    capacity: 100,
                    max_occupancy: 100,
                    usage_percentage: 0,
                }}
            />
        );

        expect(screen.getByRole("dialog", { name: "Resolve Event" })).toHaveTextContent(
            "Set the final date and close this emergency event."
        );
        expect(screen.getByText("Flood response")).toBeVisible();
        expect(screen.getByRole("button", { name: "Resolution end date" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledOnce();
    });
});
