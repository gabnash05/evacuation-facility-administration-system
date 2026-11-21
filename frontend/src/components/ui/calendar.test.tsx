import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadCalendar() {
    vi.resetModules();
    vi.doMock("react-day-picker", async () => {
        const React = await import("react");
        return {
            DayPicker: ({ className, showOutsideDays, captionLayout }: Record<string, unknown>) =>
                React.createElement("div", {
                    "data-testid": "day-picker",
                    "data-slot": "day-picker",
                    "data-show-outside-days": String(showOutsideDays),
                    "data-caption-layout": captionLayout,
                    className,
                }),
            DayButton: () => null,
            getDefaultClassNames: () => ({}),
        };
    });
    return import("./calendar");
}

afterEach(() => {
    vi.doUnmock("react-day-picker");
    vi.resetModules();
});

describe("Calendar", () => {
    it("forwards shared defaults and caller classes to the day picker", async () => {
        const { Calendar } = await loadCalendar();

        render(<Calendar className="event-calendar" />);

        const picker = screen.getByTestId("day-picker");
        expect(picker).toHaveClass("event-calendar");
        expect(picker).toHaveAttribute("data-show-outside-days", "true");
        expect(picker).toHaveAttribute("data-caption-layout", "label");
    });
});
