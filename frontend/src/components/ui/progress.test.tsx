import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "./progress";

describe("Progress", () => {
    it("exposes the supplied progress value and indicator position", () => {
        render(<Progress value={35} aria-label="Allocation completion" />);

        expect(screen.getByRole("progressbar", { name: "Allocation completion" })).toHaveAttribute(
            "aria-valuenow",
            "35"
        );
        const indicator = document.querySelector('[data-slot="progress-indicator"]');
        expect(indicator).toHaveStyle({ transform: "translateX(-65%)" });
    });
});
