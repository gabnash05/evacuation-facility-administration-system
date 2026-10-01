import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvacuationCenterTableToolbar } from "./EvacuationCenterTableToolbar";

describe("EvacuationCenterTableToolbar", () => {
    it("forwards search and add actions while preventing additions during loading", () => {
        const onSearchChange = vi.fn();
        const onAddCenter = vi.fn();
        const props = {
            searchQuery: "",
            onSearchChange,
            onAddCenter,
            entriesPerPage: 10,
            onEntriesPerPageChange: vi.fn(),
            loading: false,
        };
        const { rerender } = render(<EvacuationCenterTableToolbar {...props} />);
        fireEvent.change(screen.getByPlaceholderText("Search evacuation centers"), {
            target: { value: "North" },
        });
        fireEvent.click(screen.getByRole("button", { name: /add center/i }));
        expect(onSearchChange).toHaveBeenCalledWith("North");
        expect(onAddCenter).toHaveBeenCalledOnce();
        rerender(<EvacuationCenterTableToolbar {...props} loading />);
        expect(screen.getByRole("button", { name: /add center/i })).toBeDisabled();
    });
});
