import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
    it("renders semantic content with the selected variant", () => {
        render(<Badge variant="destructive">Unavailable</Badge>);

        expect(screen.getByText("Unavailable")).toHaveAttribute("data-slot", "badge");
        expect(screen.getByText("Unavailable").className).toContain("bg-destructive");
    });
});
