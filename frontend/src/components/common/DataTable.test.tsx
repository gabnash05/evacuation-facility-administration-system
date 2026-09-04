import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";

const columns = [
    { key: "name", label: "Name" },
    { key: "status", label: "Status", sortable: false },
];

describe("DataTable", () => {
    it("uses a keyboard-operable button for sortable headers", () => {
        const onSort = vi.fn();
        render(
            <DataTable
                columns={columns}
                data={[{ name: "North Hall", status: "Active" }]}
                onSort={onSort}
                sortColumn="name"
                sortDirection="asc"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /name/i }));

        expect(onSort).toHaveBeenCalledWith("name");
        expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
            "aria-sort",
            "ascending"
        );
    });

    it("renders an explicit empty state spanning all visible columns", () => {
        render(<DataTable columns={columns} data={[]} renderActions={() => null} />);

        expect(screen.getByText("No results found.")).toHaveAttribute("colspan", "3");
    });
});
