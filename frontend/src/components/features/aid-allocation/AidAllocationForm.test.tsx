import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/aidAllocationService", () => ({
    AidAllocationService: { getCategories: () => Promise.resolve({ success: true, data: [] }) },
}));

import { AidAllocationForm } from "./AidAllocationForm";

describe("AidAllocationForm", () => {
    it("blocks an incomplete allocation before creating a payload", () => {
        const onSubmit = vi.fn();
        render(
            <AidAllocationForm
                isOpen
                onClose={vi.fn()}
                onSubmit={onSubmit}
                centers={[{ id: 1, name: "North Center" }]}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Allocate Aid" }));

        expect(screen.getByText("Evacuation center is required")).toBeInTheDocument();
        expect(screen.getByText("Distribution rule is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
