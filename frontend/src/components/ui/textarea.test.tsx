import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
    it("forwards changes and retains disabled state", () => {
        const onChange = vi.fn();
        render(
            <>
                <Textarea aria-label="Transfer notes" onChange={onChange} />
                <Textarea aria-label="Disabled notes" disabled />
            </>
        );

        fireEvent.change(screen.getByRole("textbox", { name: "Transfer notes" }), {
            target: { value: "Medical transfer" },
        });

        expect(onChange).toHaveBeenCalledOnce();
        expect(screen.getByRole("textbox", { name: "Disabled notes" })).toBeDisabled();
    });
});
