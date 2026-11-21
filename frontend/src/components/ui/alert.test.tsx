import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
    it("renders its title and description as an accessible destructive alert", () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Unable to save</AlertTitle>
                <AlertDescription>Please try again.</AlertDescription>
            </Alert>
        );

        expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
        expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
        expect(screen.getByText("Unable to save")).toHaveAttribute("data-slot", "alert-title");
    });
});
