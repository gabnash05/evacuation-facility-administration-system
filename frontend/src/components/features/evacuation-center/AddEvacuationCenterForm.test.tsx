import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ addCenter: vi.fn(), loading: false }),
}));
vi.mock("../map/MapLocationPicker", () => ({
    default: ({
        onLocationSelect,
        onLocationClear,
    }: {
        onLocationSelect: (location: { lat: number; lng: number }) => void;
        onLocationClear: () => void;
    }) => (
        <>
            <button type="button" onClick={() => onLocationSelect({ lat: 0, lng: 124 })}>
                Select zero latitude
            </button>
            <button type="button" onClick={onLocationClear}>
                Clear selection
            </button>
        </>
    ),
}));
vi.mock("./DuplicateCenterDialog", () => ({ DuplicateCenterDialog: () => null }));

import { AddEvacuationCenterForm } from "./AddEvacuationCenterForm";

describe("AddEvacuationCenterForm", () => {
    it("shows required inputs and prevents submission before map selection", () => {
        render(<AddEvacuationCenterForm isOpen onClose={vi.fn()} />);

        expect(screen.getByRole("dialog", { name: "Add evacuation center" })).toHaveTextContent(
            "Provide the center details and select its location on the map."
        );
        expect(screen.getByRole("textbox", { name: "Center Name" })).toBeRequired();
        expect(screen.getByRole("textbox", { name: "Address" })).toBeRequired();
        expect(screen.getByRole("button", { name: "+ Add Center" })).toBeDisabled();
    });

    it("accepts zero coordinates and disables confirmation after clearing the map", () => {
        render(<AddEvacuationCenterForm isOpen onClose={vi.fn()} />);

        fireEvent.click(screen.getByText("Click to select location on map"));
        fireEvent.click(screen.getByRole("button", { name: "Select zero latitude" }));
        expect(screen.getByRole("button", { name: "Confirm Location" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
        expect(screen.getByRole("button", { name: "Confirm Location" })).toBeDisabled();
    });
});
