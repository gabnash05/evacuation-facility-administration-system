import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HouseholdDetailsModal } from "./HouseholdDetailsModal";

vi.mock("@/store/householdStore", () => ({
    useHouseholdStore: () => ({
        getHouseholdDetails: vi.fn(),
        getHouseholdIndividuals: vi.fn(),
    }),
}));

describe("HouseholdDetailsModal", () => {
    it("renders an explicit not-found state when opened without a household identifier", () => {
        render(<HouseholdDetailsModal householdId={null} isOpen onClose={vi.fn()} />);

        expect(screen.getByRole("heading", { name: "Household Details" })).toBeInTheDocument();
        expect(screen.getByText("Household data not found.")).toBeInTheDocument();
    });
});
