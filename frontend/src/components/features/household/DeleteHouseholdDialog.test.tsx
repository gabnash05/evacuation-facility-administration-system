import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteHouseholdDialog } from "./DeleteHouseholdDialog";

describe("DeleteHouseholdDialog", () => {
    it("identifies the selected household and prevents duplicate deletion while pending", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(
            <DeleteHouseholdDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                householdName="Santos Family"
                loading
            />
        );

        expect(screen.getByText(/Santos Family/)).toBeInTheDocument();
        expect(screen.getByText(/all individuals associated/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Deleting..." }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
