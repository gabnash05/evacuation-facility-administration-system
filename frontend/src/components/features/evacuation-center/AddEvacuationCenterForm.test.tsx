import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ addCenter: vi.fn(), loading: false }),
}));
vi.mock("../map/MapLocationPicker", () => ({ default: () => <div /> }));
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
});
