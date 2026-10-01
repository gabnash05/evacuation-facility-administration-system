import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteAttendanceDialog } from "./DeleteAttendanceDialog";

describe("DeleteAttendanceDialog", () => {
    it("identifies the affected individual and prevents duplicate deletion while pending", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(
            <DeleteAttendanceDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                individualName="Ana Santos"
                loading
            />
        );

        expect(screen.getByText(/Ana Santos/)).toBeInTheDocument();
        expect(screen.getByText(/permanently remove/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Deleting..." }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
