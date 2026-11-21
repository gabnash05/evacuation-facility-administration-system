import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
    it("forwards clicks and prevents interaction while disabled", () => {
        const onClick = vi.fn();
        render(
            <>
                <Button onClick={onClick}>Save</Button>
                <Button disabled onClick={onClick} variant="destructive">
                    Delete
                </Button>
            </>
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        expect(onClick).toHaveBeenCalledOnce();
        expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    });
});
