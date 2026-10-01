import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StaticMap } from "./StaticMap";

const { monoMap } = vi.hoisted(() => ({ monoMap: vi.fn(() => null) }));

vi.mock("./MonoMap", () => ({ default: monoMap }));

describe("StaticMap", () => {
    it("forwards supplied static markers to MonoMap as centers", () => {
        const markers = [
            {
                id: 4,
                name: "North Hall",
                position: [8.23, 124.25] as [number, number],
                currentCapacity: 20,
                maxCapacity: 100,
                address: "Barangay One",
                contact: "N/A",
            },
        ];

        render(<StaticMap markers={markers} />);

        expect(monoMap).toHaveBeenCalled();
        expect(monoMap.mock.calls.at(-1)?.[0]).toMatchObject({ centers: markers });
    });
});
