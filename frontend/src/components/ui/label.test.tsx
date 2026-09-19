import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";
import { Label } from "./label";

describe("Label", () => {
    it("associates its text with the supplied form control", () => {
        render(
            <>
                <Label htmlFor="household-name">Household name</Label>
                <Input id="household-name" />
            </>
        );

        expect(screen.getByLabelText("Household name")).toHaveAttribute("id", "household-name");
    });
});
