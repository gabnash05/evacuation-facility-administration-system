import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableToolbar } from "./Toolbar";

const props = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    onAddItem: vi.fn(),
    entriesPerPage: 10,
    onEntriesPerPageChange: vi.fn(),
    loading: false,
};

describe("TableToolbar", () => {
    it("forwards controlled search and add-item actions", () => {
        render(
            <TableToolbar
                {...props}
                searchPlaceholder="Search centers"
                addButtonText="Add center"
            />
        );

        fireEvent.change(screen.getByPlaceholderText("Search centers"), {
            target: { value: "North" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add center" }));

        expect(props.onSearchChange).toHaveBeenCalledWith("North");
        expect(props.onAddItem).toHaveBeenCalledTimes(1);
    });

    it("honors the explicit entries-selector visibility contract", () => {
        const { rerender } = render(<TableToolbar {...props} showEntriesSelector={false} />);
        expect(screen.queryByText("Show")).not.toBeInTheDocument();

        rerender(<TableToolbar {...props} showEntriesSelector />);
        expect(screen.getByText("Show")).toBeInTheDocument();
    });
});
