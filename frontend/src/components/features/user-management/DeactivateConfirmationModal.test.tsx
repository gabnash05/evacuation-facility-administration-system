import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeactivateConfirmationModal } from "./DeactivateConfirmationModal";

describe("DeactivateConfirmationModal", () => {
    it("describes the account-state action and keeps cancel and confirm callbacks distinct", () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        render(
            <DeactivateConfirmationModal
                isOpen
                onClose={onClose}
                onConfirm={onConfirm}
                title="Deactivate volunteer"
                description="The volunteer cannot sign in until reactivated."
            />
        );

        expect(screen.getByRole("dialog", { name: "Deactivate volunteer" })).toHaveTextContent(
            "The volunteer cannot sign in until reactivated."
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onConfirm).toHaveBeenCalledOnce();
    });
});
