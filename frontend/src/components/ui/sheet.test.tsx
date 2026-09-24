import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet";

describe("Sheet", () => {
    it("opens a labelled side panel, applies the selected side, and closes", () => {
        render(
            <Sheet>
                <SheetTrigger>Open center filters</SheetTrigger>
                <SheetContent side="left">
                    <SheetTitle>Center filters</SheetTitle>
                    <SheetDescription>Filter visible evacuation centers.</SheetDescription>
                </SheetContent>
            </Sheet>
        );

        fireEvent.click(screen.getByRole("button", { name: "Open center filters" }));

        const sheet = screen.getByRole("dialog", { name: "Center filters" });
        expect(sheet).toHaveClass("left-0", "border-r");
        expect(sheet).toHaveTextContent("Filter visible evacuation centers.");

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
