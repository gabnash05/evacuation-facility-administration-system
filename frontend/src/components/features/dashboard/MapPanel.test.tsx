import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { monoMap } = vi.hoisted(() => ({
    monoMap: vi.fn(() => <div data-testid="mono-map" />),
}));
vi.mock("../map/MonoMap", () => ({ default: monoMap }));

import { MapPanel } from "./MapPanel";

describe("MapPanel", () => {
    it("filters invalid center coordinates and highlights the assigned valid center", () => {
        render(
            <MapPanel
                isPanelVisible={false}
                setIsPanelVisible={vi.fn()}
                selectedCenter={{
                    name: "Assigned Center",
                    address: "Main Street",
                    status: "active",
                    capacity: 100,
                    current_occupancy: 20,
                }}
                isLoadingCenter={false}
                getCenterStatusStyles={() => "status-style"}
                getUsageColor={() => "usage-style"}
                highlightCenterId={2}
                centers={[
                    {
                        center_id: 1,
                        center_name: "Invalid Center",
                        address: "Elsewhere",
                        status: "active",
                        capacity: 10,
                        current_occupancy: 0,
                        latitude: 100,
                        longitude: 10,
                    },
                    {
                        center_id: 2,
                        center_name: "Assigned Center",
                        address: "Main Street",
                        status: "active",
                        capacity: 100,
                        current_occupancy: 20,
                        latitude: 8.2,
                        longitude: 124.2,
                    },
                ]}
            />
        );

        expect(screen.getByTestId("mono-map")).toBeInTheDocument();
        expect(monoMap).toHaveBeenCalledWith(
            expect.objectContaining({
                centers: [
                    expect.objectContaining({ id: 2, position: [8.2, 124.2] }),
                ],
                center: [8.2, 124.2],
                zoom: 17,
                highlightCenterId: 2,
            }),
            undefined
        );
    });

    it("shows a loading map placeholder until center loading completes", () => {
        render(
            <MapPanel
                isPanelVisible={false}
                setIsPanelVisible={vi.fn()}
                selectedCenter={{ name: "Center", address: "", status: "closed", capacity: 0, current_occupancy: 0 }}
                isLoadingCenter
                getCenterStatusStyles={() => ""}
                getUsageColor={() => ""}
            />
        );

        expect(screen.getByText("Loading map...")).toBeInTheDocument();
        expect(monoMap).not.toHaveBeenCalled();
    });
});
