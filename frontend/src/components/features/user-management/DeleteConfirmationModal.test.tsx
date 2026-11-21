import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

describe("DeleteConfirmationModal", () => {
    it("describes the destructive action and keeps cancel and confirm callbacks distinct", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        render(
            <DeleteConfirmationModal
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                title="Delete volunteer"
                description="This permanently removes the volunteer account."
            />
        );

        expect(screen.getByRole("dialog", { name: "Delete volunteer" })).toHaveTextContent(
            "This permanently removes the volunteer account."
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onConfirm).toHaveBeenCalledOnce();
    });
});
