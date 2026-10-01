import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddIndividualModal } from "./AddIndividualModal";

describe("AddIndividualModal", () => {
    it("rejects incomplete members before calling the parent workflow", () => {
        const onAdd = vi.fn();
        render(<AddIndividualModal isOpen onClose={vi.fn()} onAdd={onAdd} />);

        fireEvent.click(screen.getByRole("button", { name: "Add Member" }));

        expect(
            screen.getByText("First Name, Last Name, and Relationship are required.")
        ).toBeInTheDocument();
        expect(onAdd).not.toHaveBeenCalled();
    });
});
