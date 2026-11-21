import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTablePagination } from "./DataTablePagination";

describe("DataTablePagination", () => {
    it("reports the one-based page range and enforces supplied navigation bounds", () => {
        const onPreviousPage = vi.fn();
        const onNextPage = vi.fn();
        render(
            <DataTablePagination
                pageIndex={1}
                pageCount={3}
                canPreviousPage
                canNextPage={false}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
            />
        );

        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(onPreviousPage).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onNextPage).not.toHaveBeenCalled();
    });
});
