import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TablePagination } from "./TablePagination";

describe("TablePagination", () => {
    it("renders the empty range without navigation controls", () => {
        render(
            <TablePagination
                currentPage={1}
                entriesPerPage={10}
                totalEntries={0}
                onPageChange={vi.fn()}
                entriesLabel="households"
            />
        );

        expect(screen.getByText("Showing 0 to 0 of 0 households")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    });

    it("uses a bounded sliding page window and navigates from its controls", () => {
        const onPageChange = vi.fn();
        render(
            <TablePagination
                currentPage={5}
                entriesPerPage={10}
                totalEntries={100}
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByText("Showing 41 to 50 of 100 entries")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "10" }));

        expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 6);
        expect(onPageChange).toHaveBeenNthCalledWith(3, 10);
    });

    it("disables page-changing controls while loading", () => {
        render(
            <TablePagination
                currentPage={2}
                entriesPerPage={10}
                totalEntries={30}
                onPageChange={vi.fn()}
                loading
            />
        );

        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "2" })).toBeDisabled();
    });
});
