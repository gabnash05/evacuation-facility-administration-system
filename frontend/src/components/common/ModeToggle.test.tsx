import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { setTheme, useTheme } = vi.hoisted(() => ({
    setTheme: vi.fn(),
    useTheme: vi.fn(() => ({ theme: "light", setTheme })),
}));

vi.mock("@/components/common/ThemeProvider", () => ({ useTheme }));

import { ModeToggle } from "./ModeToggle";

describe("ModeToggle", () => {
    it("uses a native menu button and applies the selected theme", () => {
        render(<ModeToggle>Appearance</ModeToggle>);

        const trigger = screen.getByRole("button", { name: "Appearance" });
        fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
        fireEvent.click(screen.getByRole("menuitem", { name: "Dark" }));

        expect(setTheme).toHaveBeenCalledWith("dark");
    });
});
