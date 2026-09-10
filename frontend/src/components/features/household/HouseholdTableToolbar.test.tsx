import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HouseholdTableToolbar } from "./HouseholdTableToolbar";

describe("HouseholdTableToolbar", () => {
    it("forwards search and add actions while preserving its controlled value", () => {
        const onSearchChange = vi.fn();
        const onAddHousehold = vi.fn();
        render(
            <HouseholdTableToolbar
                searchQuery="North"
                onSearchChange={onSearchChange}
                onAddHousehold={onAddHousehold}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                loading={false}
            />
        );

        const search = screen.getByPlaceholderText("Search households");
        expect(search).toHaveValue("North");
        fireEvent.change(search, { target: { value: "South" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Household" }));

        expect(onSearchChange).toHaveBeenCalledWith("South");
        expect(onAddHousehold).toHaveBeenCalledOnce();
    });

    it("disables all interactive controls while loading", () => {
        render(
            <HouseholdTableToolbar
                searchQuery=""
                onSearchChange={vi.fn()}
                onAddHousehold={vi.fn()}
                entriesPerPage={10}
                onEntriesPerPageChange={vi.fn()}
                loading
            />
        );

        expect(screen.getByPlaceholderText("Search households")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Add Household" })).toBeDisabled();
        expect(screen.getByRole("combobox")).toBeDisabled();
    });
});
