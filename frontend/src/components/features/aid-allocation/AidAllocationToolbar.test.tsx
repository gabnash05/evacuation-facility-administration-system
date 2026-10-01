import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AidDistributionToolbar } from "./AidAllocationToolbar";

describe("AidDistributionToolbar", () => {
    it("forwards search and allocation actions while respecting loading lockout", () => {
        const onSearchChange = vi.fn();
        const onAddAllocation = vi.fn();
        const props = {
            searchQuery: "",
            onSearchChange,
            onAddAllocation,
            entriesPerPage: 10,
            onEntriesPerPageChange: vi.fn(),
            loading: false,
        };
        const { rerender } = render(<AidDistributionToolbar {...props} />);

        fireEvent.change(screen.getByRole("textbox", { name: "Search allocations" }), {
            target: { value: "rice" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Allocate Aid" }));
        expect(onSearchChange).toHaveBeenCalledWith("rice");
        expect(onAddAllocation).toHaveBeenCalledOnce();

        rerender(<AidDistributionToolbar {...props} loading />);
        expect(screen.getByRole("button", { name: "Allocate Aid" })).toBeDisabled();
        expect(screen.getByRole("combobox", { name: "Entries per page" })).toBeDisabled();
    });
});
