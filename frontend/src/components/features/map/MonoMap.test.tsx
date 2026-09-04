import { describe, expect, it, vi } from "vitest";

const { divIcon } = vi.hoisted(() => ({
    divIcon: vi.fn((options: { html: string }) => ({ options })),
}));

vi.mock("leaflet", () => ({
    default: {
        Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
        divIcon,
    },
}));

vi.mock("react-leaflet", () => ({
    MapContainer: () => null,
    TileLayer: () => null,
    Marker: () => null,
    ScaleControl: () => null,
    Tooltip: () => null,
    useMap: () => ({ flyTo: vi.fn(), getZoom: vi.fn(), setView: vi.fn() }),
}));

import { createMarkerIcon } from "./MonoMap";

describe("createMarkerIcon", () => {
    it("never interpolates a center name into Leaflet marker HTML", () => {
        const hostileName = '<img src=x onerror="alert(1)">';
        const icon = createMarkerIcon("#2563eb", 10, 20);

        expect(icon.options.html).not.toContain(hostileName);
        expect(icon.options.html).not.toContain("data-name");
        expect(icon.options.html).toContain('data-capacity="50%');
    });
});
