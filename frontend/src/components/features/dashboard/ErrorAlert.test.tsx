import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorAlert } from "./ErrorAlert";

describe("ErrorAlert", () => {
    it("renders no alert when no error is supplied", () => {
        render(<ErrorAlert error={null} />);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("exposes a supplied error to assistive technology", () => {
        render(<ErrorAlert error="Unable to load dashboard data." />);

        expect(screen.getByRole("alert")).toHaveTextContent("Unable to load dashboard data.");
    });
});
