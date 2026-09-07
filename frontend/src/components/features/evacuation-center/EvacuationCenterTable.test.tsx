import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const deleteCenter = vi.fn();
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ deleteCenter }),
}));
vi.mock("./DeleteCenterDialog", () => ({ DeleteCenterDialog: () => null }));
vi.mock("./EditEvacuationCenterForm", () => ({ EditEvacuationCenterForm: () => null }));

import { EvacuationCenterTable } from "./EvacuationCenterTable";

const center = {
    center_id: 4,
    center_name: "Central School",
    address: "Main Street",
    capacity: 100,
    current_occupancy: 125,
    status: "active",
} as never;

describe("EvacuationCenterTable", () => {
    it("renders an explicit empty state", () => {
        render(<EvacuationCenterTable data={[]} sortConfig={null} onSort={vi.fn()} />);
        expect(screen.getByText("No evacuation centers found")).toBeInTheDocument();
    });

    it("forwards sortable header and row actions while limiting deletion to super admins", () => {
        const onSort = vi.fn();
        const onRowClick = vi.fn();
        render(
            <EvacuationCenterTable
                data={[center]}
                sortConfig={null}
                onSort={onSort}
                onRowClick={onRowClick}
                userRole="center_admin"
            />
        );

        fireEvent.click(screen.getByText("Center Name"));
        fireEvent.click(screen.getByText("Central School"));
        fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

        expect(onSort).toHaveBeenCalledWith("center_name");
        expect(onRowClick).toHaveBeenCalledWith(center);
        expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
        expect(screen.getByText("125%")).toBeInTheDocument();
    });
});
