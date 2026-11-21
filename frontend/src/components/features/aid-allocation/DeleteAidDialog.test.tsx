import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteAidDialog } from "./DeleteAidDialog";

describe("DeleteAidDialog", () => {
    it("identifies the allocation and keeps cancel and deletion actions distinct", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        render(
            <DeleteAidDialog
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                allocationName="Water supply"
            />
        );

        expect(screen.getByRole("dialog", { name: "Delete Aid Allocation" })).toHaveTextContent(
            'aid allocation for "Water supply"'
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Delete Allocation" }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("prevents duplicate actions while deletion is pending", () => {
        render(
            <DeleteAidDialog
                isOpen
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                allocationName="Water supply"
                loading
            />
        );

        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    });
});
