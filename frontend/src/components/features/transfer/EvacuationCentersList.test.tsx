import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvacuationCentersList } from "./EvacuationCentersList";

const centers = [
    { center_id: 1, center_name: "Central Center", capacity: 0, current_occupancy: 0 },
    { center_id: 2, center_name: "North Center", capacity: 20, current_occupancy: 10 },
];

describe("EvacuationCentersList", () => {
    it("handles zero capacity safely and forwards center selection", () => {
        const onCenterSelect = vi.fn();
        render(
            <EvacuationCentersList
                centers={centers}
                selectedCenterId={null}
                onCenterSelect={onCenterSelect}
            />
        );

        expect(screen.getByText("0%")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("checkbox", { name: "Select North Center" }));
        expect(onCenterSelect).toHaveBeenCalledWith(2);
    });

    it("renders a filter-specific empty state", () => {
        render(
            <EvacuationCentersList
                centers={centers}
                selectedCenterId={null}
                onCenterSelect={vi.fn()}
                searchQuery="none"
            />
        );

        expect(screen.getByText("No centers found")).toBeInTheDocument();
    });
});
