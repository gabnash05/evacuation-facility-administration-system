import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./input";

describe("Input", () => {
    it("forwards changes and preserves disabled state", () => {
        const onChange = vi.fn();
        render(
            <>
                <Input aria-label="Household search" onChange={onChange} />
                <Input aria-label="Disabled search" disabled />
            </>
        );

        fireEvent.change(screen.getByRole("textbox", { name: "Household search" }), {
            target: { value: "Santos" },
        });

        expect(onChange).toHaveBeenCalledOnce();
        expect(screen.getByRole("textbox", { name: "Disabled search" })).toBeDisabled();
    });
});
