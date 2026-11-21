import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteCenterDialog } from "./DeleteCenterDialog";

describe("DeleteCenterDialog", () => {
    it("identifies the selected center and disables destructive actions while pending", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        const { rerender } = render(
            <DeleteCenterDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                centerName="North Hall"
            />
        );

        expect(screen.getByRole("dialog")).toHaveTextContent('"North Hall"');
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(onConfirm).toHaveBeenCalledOnce();

        rerender(
            <DeleteCenterDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                centerName="North Hall"
                loading
            />
        );
        expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
});
