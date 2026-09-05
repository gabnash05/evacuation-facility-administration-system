import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvacuationCenterTablePagination } from "./EvacuationCenterTablePagination";

describe("EvacuationCenterTablePagination", () => {
    it("reports ranges and keeps navigation within available pages", () => {
        const onPageChange = vi.fn();
        render(
            <EvacuationCenterTablePagination
                currentPage={2}
                entriesPerPage={10}
                totalEntries={27}
                onPageChange={onPageChange}
            />
        );
        expect(screen.getByText("Showing 11 to 20 of 27 entries")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /previous/i }));
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
        expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    });
});
