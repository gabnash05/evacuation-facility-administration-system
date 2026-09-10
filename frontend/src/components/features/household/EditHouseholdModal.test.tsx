import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditHouseholdModal } from "./EditHouseholdModal";

vi.mock("@/store/householdStore", () => ({
    useHouseholdStore: () => ({
        updateHousehold: vi.fn(),
        getHouseholdDetails: vi.fn(),
        getHouseholdIndividuals: vi.fn(),
    }),
}));
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters: vi.fn(), loading: false }),
}));

describe("EditHouseholdModal", () => {
    it("presents an accessible edit dialog without fetching when nothing is selected", () => {
        render(
            <EditHouseholdModal householdId={null} isOpen onClose={vi.fn()} onSuccess={vi.fn()} />
        );

        expect(screen.getByRole("heading", { name: "Edit Household" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });
});
