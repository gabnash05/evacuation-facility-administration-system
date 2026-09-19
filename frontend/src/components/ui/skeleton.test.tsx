import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
    it("renders its loading affordance and forwards element props", () => {
        const { container } = render(
            <Skeleton aria-label="Loading attendance" className="custom-skeleton" />
        );

        const skeleton = container.querySelector('[data-slot="skeleton"]');

        expect(skeleton).toHaveAttribute("aria-label", "Loading attendance");
        expect(skeleton).toHaveClass("animate-pulse", "custom-skeleton");
    });
});
