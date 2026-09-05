import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmationDialog } from "./ConfirmationDialog";

describe("ConfirmationDialog", () => {
    it("shows the supplied confirmation and prevents duplicate actions while saving", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        const { rerender } = render(
            <ConfirmationDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                title="Update center"
                message="Confirm changes."
            />
        );

        expect(screen.getByRole("dialog")).toHaveTextContent("Update center");
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
        expect(onConfirm).toHaveBeenCalledOnce();

        rerender(
            <ConfirmationDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                title="Update center"
                message="Confirm changes."
                loading
            />
        );
        expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
});
