import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EvacuationCenter } from "@/types/center";

const { updateCenter, confirmation } = vi.hoisted(() => ({
    updateCenter: vi.fn(),
    confirmation: { current: null as null | (() => Promise<void>) },
}));

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ updateCenter, loading: false }),
}));
vi.mock("../map/MapLocationPicker", () => ({
    default: ({
        onLocationClear,
        onCancel,
    }: {
        onLocationClear: () => void;
        onCancel: () => void;
    }) => (
        <>
            <button type="button" onClick={onLocationClear}>
                Clear selection
            </button>
            <button type="button" onClick={onCancel}>
                Close map
            </button>
        </>
    ),
}));
vi.mock("./ConfirmationDialog", () => ({
    ConfirmationDialog: ({
        isOpen,
        onConfirm,
    }: {
        isOpen: boolean;
        onConfirm: () => Promise<void>;
    }) => {
        confirmation.current = isOpen ? onConfirm : null;
        return null;
    },
}));
vi.mock("./DuplicateCenterDialog", () => ({ DuplicateCenterDialog: () => null }));

import { EditEvacuationCenterForm } from "./EditEvacuationCenterForm";

const center: EvacuationCenter = {
    center_id: 1,
    center_name: "North Center",
    address: "North Road",
    latitude: 0,
    longitude: 124,
    capacity: 100,
    current_occupancy: 20,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
};

describe("EditEvacuationCenterForm", () => {
    beforeEach(() => {
        updateCenter.mockReset();
        confirmation.current = null;
    });

    it("accepts zero coordinates and prevents stale-location save after clearing", () => {
        render(<EditEvacuationCenterForm isOpen center={center} onClose={vi.fn()} />);

        expect(
            screen.getByText("Update the center details and save your changes.")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Update Center" })).toBeEnabled();
        fireEvent.click(screen.getByRole("button", { name: "Change" }));
        expect(
            screen.getByText("Select a point on the map, then confirm the location.")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirm Location" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
        expect(screen.getByRole("button", { name: "Confirm Location" })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: "Close map" }));
        expect(screen.getByRole("button", { name: "Update Center" })).toBeDisabled();

        fireEvent.keyDown(screen.getByRole("button", { name: /Click to select location/ }), {
            key: "Enter",
        });
        expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
    });

    it("keeps the form open and announces a failed save", async () => {
        updateCenter.mockRejectedValue(new Error("Network unavailable"));
        const onClose = vi.fn();
        render(<EditEvacuationCenterForm isOpen center={center} onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: "Update Center" }));
        expect(confirmation.current).not.toBeNull();
        await act(async () => {
            await confirmation.current?.();
        });

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Failed to update the center. Please try again."
        );
        expect(onClose).not.toHaveBeenCalled();
    });
});
