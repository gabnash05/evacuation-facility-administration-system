import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DistributionRecord } from "@/types/distribution";
import { DistributionHistoryTable } from "./DistributionHistoryTable";

const { toggleStatus } = vi.hoisted(() => ({ toggleStatus: vi.fn() }));
vi.mock("@/store/distributionStore", () => ({ useDistributionStore: () => ({ toggleStatus }) }));

const record: DistributionRecord = {
    distribution_id: 42,
    distribution_date: "2026-01-01T12:00:00Z",
    center_id: 2,
    household_id: 3,
    allocation_id: 4,
    household_name: "North household",
    category_name: "Food",
    resource_name: "Food pack",
    quantity: 1,
    volunteer_name: "Volunteer",
    formatted_items: "Food pack",
    status: "completed",
};

describe("DistributionHistoryTable", () => {
    beforeEach(() => toggleStatus.mockClear());

    it.each(["city_admin", "center_admin", "volunteer", undefined])(
        "shows distribution records without mutation controls for %s",
        userRole => {
            render(<DistributionHistoryTable data={[record]} userRole={userRole} />);

            expect(screen.getByText("North household")).toBeInTheDocument();
            expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Distribution actions" })).toBeNull();
        }
    );

    it.each([
        { status: "completed", action: "Void Record" },
        { status: "voided", action: "Restore Record" },
    ] as const)("lets a super administrator choose $action", ({ status, action }) => {
        render(<DistributionHistoryTable data={[{ ...record, status }]} userRole="super_admin" />);

        fireEvent.keyDown(screen.getByRole("button", { name: "Distribution actions" }), {
            key: "Enter",
        });
        fireEvent.click(screen.getByRole("menuitem", { name: action }));

        expect(toggleStatus).toHaveBeenCalledExactlyOnceWith(42);
    });
});
