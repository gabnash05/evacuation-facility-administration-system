import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AidDistributionTable } from "./AidAllocationTable";

const columns = [
    { key: "resource_name", label: "Resource" },
    { key: "remaining_quantity", label: "Remaining" },
];

describe("AidDistributionTable", () => {
    it("exposes sortable headings and a safe empty state", () => {
        const onSort = vi.fn();
        const { rerender } = render(
            <AidDistributionTable columns={columns} data={[]} onSort={onSort} showActions={false} />
        );

        expect(screen.getByText("No aid distribution records found")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Resource" }));
        expect(onSort).toHaveBeenCalledWith("resource_name");

        rerender(
            <AidDistributionTable
                columns={columns}
                data={[{ resource_name: "Rice", remaining_quantity: 0, total_quantity: 0 }]}
                showActions={false}
            />
        );
        expect(screen.getByText("Rice")).toBeInTheDocument();
        expect(screen.getByText("0% remaining")).toBeInTheDocument();
    });
});
