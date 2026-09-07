import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteEventDialog } from "./DeleteEventDialog";

describe("DeleteEventDialog", () => {
    it("identifies the selected event and prevents duplicate destructive actions", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(
            <DeleteEventDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                eventName="Flood"
                loading
            />
        );

        expect(screen.getByText(/Flood/)).toBeInTheDocument();
        expect(screen.getByText("Deleting...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Deleting..." }));
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
