import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HouseholdTablePagination } from "./HouseholdTablePagination";

describe("HouseholdTablePagination", () => {
    it("renders a bounded sliding page window and forwards the selected page", () => {
        const onPageChange = vi.fn();
        render(
            <HouseholdTablePagination
                currentPage={4}
                totalPages={10}
                totalRecords={43}
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByText("Total 43 households")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "6" }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(onPageChange).toHaveBeenNthCalledWith(1, 6);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 5);
    });

    it("disables navigation at its supplied boundaries and while loading", () => {
        const onPageChange = vi.fn();
        const { rerender } = render(
            <HouseholdTablePagination
                currentPage={1}
                totalPages={3}
                totalRecords={5}
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
        rerender(
            <HouseholdTablePagination
                currentPage={2}
                totalPages={3}
                totalRecords={5}
                loading
                onPageChange={onPageChange}
            />
        );

        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "2" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });
});
