import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadSelect() {
    vi.resetModules();
    vi.doMock("@radix-ui/react-select", async () => {
        const React = await import("react");

        return {
            Root: ({ children, value }: React.ComponentProps<"div"> & { value?: string }) =>
                React.createElement("div", { "data-value": value }, children),
            Trigger: ({ children, ...props }: React.ComponentProps<"button">) =>
                React.createElement("button", { type: "button", ...props }, children),
            Value: ({ placeholder }: { placeholder?: string }) =>
                React.createElement("span", null, placeholder),
            Icon: ({ children }: { children?: React.ReactNode }) =>
                React.createElement(React.Fragment, null, children),
        };
    });
    return import("./select");
}

afterEach(() => {
    vi.doUnmock("@radix-ui/react-select");
    vi.resetModules();
});

describe("Select", () => {
    it("forwards the selected value and exposes a labelled, sized trigger", async () => {
        const { Select, SelectTrigger, SelectValue } = await loadSelect();

        render(
            <Select value="north">
                <SelectTrigger aria-label="Assigned center" size="sm">
                    <SelectValue placeholder="Select center" />
                </SelectTrigger>
            </Select>
        );

        const trigger = screen.getByRole("button", { name: "Assigned center" });
        expect(trigger).toHaveAttribute("data-size", "sm");
        expect(screen.getByText("Select center").closest("[data-value]")).toHaveAttribute(
            "data-value",
            "north"
        );
    });
});
