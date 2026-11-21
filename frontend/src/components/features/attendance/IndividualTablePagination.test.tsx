import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IndividualTablePagination } from "./IndividualTablePagination";

describe("IndividualTablePagination", () => {
    it("reports the visible record range and forwards bounded page navigation", () => {
        const onPageChange = vi.fn();
        render(
            <IndividualTablePagination
                currentPage={2}
                totalPages={4}
                totalRecords={33}
                pageSize={10}
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByText("Showing 11-20 of 33 individuals")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
        fireEvent.click(screen.getByRole("button", { name: "3" }));
        expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    });

    it("disables previous navigation at the first page and all controls while loading", () => {
        const { rerender } = render(
            <IndividualTablePagination
                currentPage={1}
                totalPages={2}
                totalRecords={11}
                pageSize={10}
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
        rerender(
            <IndividualTablePagination
                currentPage={1}
                totalPages={2}
                totalRecords={11}
                pageSize={10}
                loading
                onPageChange={vi.fn()}
            />
        );

        expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
    });
});
