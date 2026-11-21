import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapEvents } = vi.hoisted(() => ({
    mapEvents: {
        click: null as null | ((event: { latlng: { lat: number; lng: number } }) => void),
    },
}));

vi.mock("leaflet", () => ({
    default: {
        Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
        divIcon: vi.fn(() => ({})),
    },
}));
vi.mock("react-leaflet", () => ({
    MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TileLayer: () => null,
    ScaleControl: () => null,
    Marker: ({ eventHandlers }: { eventHandlers: { dragend: (event: unknown) => void } }) => (
        <button
            type="button"
            onClick={() =>
                eventHandlers.dragend({ target: { getLatLng: () => ({ lat: 0, lng: 125 }) } })
            }
        >
            Drag marker
        </button>
    ),
    useMapEvents: (handlers: typeof mapEvents) => {
        mapEvents.click = handlers.click;
        return null;
    },
}));
vi.mock("@/components/common/ThemeProvider", () => ({
    useTheme: () => ({ theme: "light" }),
}));

import MapLocationPicker from "./MapLocationPicker";

describe("MapLocationPicker", () => {
    beforeEach(() => {
        mapEvents.click = null;
    });

    it("accepts zero coordinates and reports map clicks, marker drags, and clearing", () => {
        const onLocationSelect = vi.fn();
        const onLocationClear = vi.fn();

        render(
            <MapLocationPicker
                initialLocation={[0, 124]}
                onLocationSelect={onLocationSelect}
                onLocationClear={onLocationClear}
            />
        );

        expect(screen.getByText("0.000000°")).toBeInTheDocument();
        expect(screen.getByText("124.000000°")).toBeInTheDocument();

        act(() => mapEvents.click?.({ latlng: { lat: 0, lng: 124.5 } }));
        expect(onLocationSelect).toHaveBeenCalledWith({ lat: 0, lng: 124.5 });

        fireEvent.click(screen.getByRole("button", { name: "Drag marker" }));
        expect(onLocationSelect).toHaveBeenCalledWith({ lat: 0, lng: 125 });

        fireEvent.click(screen.getByRole("button", { name: "Clear Location" }));
        expect(onLocationClear).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("button", { name: "Drag marker" })).not.toBeInTheDocument();
    });

    it("updates the marker when the parent's initial location changes", () => {
        const onLocationSelect = vi.fn();
        const { rerender } = render(
            <MapLocationPicker initialLocation={[1, 2]} onLocationSelect={onLocationSelect} />
        );

        rerender(
            <MapLocationPicker initialLocation={[3, 4]} onLocationSelect={onLocationSelect} />
        );

        expect(screen.getByText("3.000000°")).toBeInTheDocument();
        expect(screen.getByText("4.000000°")).toBeInTheDocument();
    });
});
