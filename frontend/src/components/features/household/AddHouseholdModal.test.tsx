import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddHouseholdModal } from "./AddHouseholdModal";

vi.mock("@/store/householdStore", () => ({
    useHouseholdStore: () => ({ createHouseholdWithIndividuals: vi.fn() }),
}));
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ centers: [], fetchAllCenters: vi.fn(), loading: false }),
}));

describe("AddHouseholdModal", () => {
    it("rejects a missing household-head identity before submitting", () => {
        render(<AddHouseholdModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Create Household" }));

        expect(
            screen.getByText("Household head first name and last name are required.")
        ).toBeInTheDocument();
    });
});
