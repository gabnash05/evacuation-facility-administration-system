import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
    it("renders an accessible viewport and forwards caller properties", () => {
        const { container } = render(
            <ScrollArea aria-label="Recent activity" className="custom-scroll-area">
                <div>Recent transfer</div>
            </ScrollArea>
        );

        expect(screen.getByLabelText("Recent activity")).toHaveClass("custom-scroll-area");
        expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toContainElement(
            screen.getByText("Recent transfer")
        );
        expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument();
    });
});
