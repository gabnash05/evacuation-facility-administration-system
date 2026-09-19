import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IndividualSearchTable } from "./IndividualSearchTable";

vi.mock("@/store/individualStore", () => ({
    useIndividualStore: () => ({
        paginatedIndividuals: [
            {
                individual_id: 7,
                first_name: "Ana",
                last_name: "Santos",
                relationship_to_head: "Daughter",
                household_id: 3,
                current_status: "checked_out",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
            },
        ],
        totalRecords: 1,
        currentPage: 1,
        searchQuery: "",
        loading: false,
        error: null,
        searchIndividuals: vi.fn(),
        clearSearch: vi.fn(),
    }),
}));

describe("IndividualSearchTable", () => {
    it("exposes named search controls and disables an already selected individual", () => {
        const onSelectIndividual = vi.fn();
        render(
            <IndividualSearchTable
                onSelectIndividual={onSelectIndividual}
                selectedIndividuals={[
                    {
                        individual_id: 7,
                        first_name: "Ana",
                        last_name: "Santos",
                        relationship_to_head: "Daughter",
                        household_id: 3,
                        current_status: "checked_out",
                        created_at: "2026-01-01T00:00:00Z",
                        updated_at: "2026-01-01T00:00:00Z",
                    },
                ]}
            />
        );

        fireEvent.change(screen.getByRole("textbox", { name: "Search individuals" }), {
            target: { value: "Ana" },
        });
        expect(screen.getByRole("button", { name: "Clear individual search" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Ana Santos/ })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Clear individual search" }));
        expect(screen.getByRole("textbox", { name: "Search individuals" })).toHaveValue("");
        expect(onSelectIndividual).not.toHaveBeenCalled();
    });
});
