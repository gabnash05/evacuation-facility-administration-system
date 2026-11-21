import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HouseholdTable } from "./HouseholdTable";

const headers = [
    { key: "householdName", label: "Household", sortable: true },
    { key: "address", label: "Address", sortable: false },
];
const household = {
    household_id: 8,
    householdName: "Santos Family",
    householdHead: "Ana Santos",
    address: "North District",
};

describe("HouseholdTable", () => {
    it("renders an explicit empty state", () => {
        render(
            <HouseholdTable
                data={[]}
                headers={headers}
                sortConfig={null}
                onSort={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onRowClick={vi.fn()}
            />
        );

        expect(screen.getByText("No households found.")).toBeInTheDocument();
    });

    it("forwards sortable header and row actions while restricting deletion by role", () => {
        const onSort = vi.fn();
        const onRowClick = vi.fn();
        const onEdit = vi.fn();
        render(
            <HouseholdTable
                data={[household]}
                headers={headers}
                sortConfig={null}
                onSort={onSort}
                onEdit={onEdit}
                onDelete={vi.fn()}
                onRowClick={onRowClick}
                userRole="volunteer"
            />
        );

        fireEvent.click(screen.getByText("Household"));
        fireEvent.click(screen.getByText("Santos Family"));
        fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Santos Family" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

        expect(onSort).toHaveBeenCalledWith("householdName");
        expect(onRowClick).toHaveBeenCalledWith(8);
        expect(onEdit).toHaveBeenCalledWith(8);
        expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    });
});
