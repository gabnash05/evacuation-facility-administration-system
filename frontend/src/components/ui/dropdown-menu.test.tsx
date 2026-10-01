import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadDropdownMenu() {
    vi.resetModules();
    vi.doMock("@radix-ui/react-dropdown-menu", async () => {
        const React = await import("react");

        return {
            Root: ({ children, ...props }: React.ComponentProps<"div">) =>
                React.createElement("div", props, children),
            Portal: ({ children }: { children: React.ReactNode }) =>
                React.createElement(React.Fragment, null, children),
            Trigger: ({ children, ...props }: React.ComponentProps<"button">) =>
                React.createElement("button", props, children),
            Content: ({
                children,
                sideOffset,
                ...props
            }: React.ComponentProps<"div"> & { sideOffset?: number }) =>
                React.createElement("div", { ...props, "data-side-offset": sideOffset }, children),
            Item: ({ children, ...props }: React.ComponentProps<"button">) =>
                React.createElement("button", props, children),
        };
    });
    return import("./dropdown-menu");
}

afterEach(() => {
    vi.doUnmock("@radix-ui/react-dropdown-menu");
    vi.resetModules();
});

describe("DropdownMenu", () => {
    it("forwards the trigger and applies the shared content offset", async () => {
        const { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } =
            await loadDropdownMenu();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open account actions</DropdownMenuTrigger>
                <DropdownMenuContent aria-label="Account actions">
                    <DropdownMenuItem>Deactivate</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        expect(screen.getByRole("button", { name: "Open account actions" })).toHaveAttribute(
            "data-slot",
            "dropdown-menu-trigger"
        );
        expect(screen.getByLabelText("Account actions")).toHaveAttribute("data-side-offset", "4");
        expect(screen.getByRole("button", { name: "Deactivate" })).toHaveAttribute(
            "data-slot",
            "dropdown-menu-item"
        );
    });
});
