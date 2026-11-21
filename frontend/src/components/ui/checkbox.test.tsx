import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
    it("reports checked state, forwards changes, and retains disabled state", () => {
        const onCheckedChange = vi.fn();
        render(
            <>
                <Checkbox aria-label="Confirm transfer" onCheckedChange={onCheckedChange} />
                <Checkbox aria-label="Locked confirmation" disabled />
            </>
        );

        fireEvent.click(screen.getByRole("checkbox", { name: "Confirm transfer" }));

        expect(onCheckedChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole("checkbox", { name: "Locked confirmation" })).toBeDisabled();
    });
});
