import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadPopover() {
    vi.resetModules();
    vi.doMock("@radix-ui/react-popover", async () => {
        const React = await import("react");

        return {
            Root: ({ children, ...props }: React.ComponentProps<"div">) =>
                React.createElement("div", props, children),
            Trigger: ({ children, ...props }: React.ComponentProps<"button">) =>
                React.createElement("button", props, children),
            Portal: ({ children }: { children: React.ReactNode }) =>
                React.createElement(React.Fragment, null, children),
            Content: ({
                align,
                sideOffset,
                children,
                ...props
            }: React.ComponentProps<"div"> & { align?: string; sideOffset?: number }) =>
                React.createElement(
                    "div",
                    { ...props, "data-align": align, "data-side-offset": sideOffset },
                    children
                ),
            Anchor: ({ children, ...props }: React.ComponentProps<"div">) =>
                React.createElement("div", props, children),
        };
    });

    return import("./popover");
}

afterEach(() => {
    vi.doUnmock("@radix-ui/react-popover");
    vi.resetModules();
});

describe("Popover", () => {
    it("forwards named content and applies the wrapper defaults", async () => {
        const { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } = await loadPopover();

        render(
            <Popover>
                <PopoverAnchor data-testid="anchor" />
                <PopoverTrigger>Open transfer details</PopoverTrigger>
                <PopoverContent aria-label="Transfer details" className="custom-popover">
                    Destination has capacity.
                </PopoverContent>
            </Popover>
        );

        expect(screen.getByRole("button", { name: "Open transfer details" })).toHaveAttribute(
            "data-slot",
            "popover-trigger"
        );
        expect(screen.getByTestId("anchor")).toHaveAttribute("data-slot", "popover-anchor");
        expect(screen.getByLabelText("Transfer details")).toHaveClass("custom-popover");
        expect(screen.getByLabelText("Transfer details")).toHaveAttribute("data-align", "center");
        expect(screen.getByLabelText("Transfer details")).toHaveAttribute("data-side-offset", "4");
    });
});
