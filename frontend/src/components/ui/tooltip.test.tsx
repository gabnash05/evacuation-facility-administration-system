import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadTooltip() {
    vi.resetModules();
    vi.doMock("@radix-ui/react-tooltip", async () => {
        const React = await import("react");

        return {
            Provider: ({
                delayDuration,
                children,
                ...props
            }: React.ComponentProps<"div"> & { delayDuration?: number }) =>
                React.createElement(
                    "div",
                    { ...props, "data-delay-duration": delayDuration },
                    children
                ),
            Root: ({ children, ...props }: React.ComponentProps<"div">) =>
                React.createElement("div", props, children),
            Trigger: ({ children, ...props }: React.ComponentProps<"button">) =>
                React.createElement("button", props, children),
            Portal: ({ children }: { children: React.ReactNode }) =>
                React.createElement(React.Fragment, null, children),
            Content: ({
                sideOffset,
                children,
                ...props
            }: React.ComponentProps<"div"> & { sideOffset?: number }) =>
                React.createElement("div", { ...props, "data-side-offset": sideOffset }, children),
            Arrow: (props: React.ComponentProps<"span">) => React.createElement("span", props),
        };
    });

    return import("./tooltip");
}

afterEach(() => {
    vi.doUnmock("@radix-ui/react-tooltip");
    vi.resetModules();
});

describe("Tooltip", () => {
    it("forwards a labelled trigger and guidance content with its default offset", async () => {
        const { Tooltip, TooltipContent, TooltipTrigger } = await loadTooltip();

        render(
            <Tooltip>
                <TooltipTrigger aria-label="Attendance help">?</TooltipTrigger>
                <TooltipContent aria-label="Attendance guidance">
                    Select an active attendance record.
                </TooltipContent>
            </Tooltip>
        );

        expect(screen.getByRole("button", { name: "Attendance help" })).toHaveAttribute(
            "data-slot",
            "tooltip-trigger"
        );
        expect(screen.getByLabelText("Attendance guidance")).toHaveAttribute(
            "data-side-offset",
            "0"
        );
        expect(screen.getByText("Select an active attendance record.")).toBeVisible();
    });
});
