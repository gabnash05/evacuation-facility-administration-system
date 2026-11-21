import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

function ThemeConsumer() {
    const { setTheme, theme } = useTheme();
    return (
        <>
            <span>{theme}</span>
            <button type="button" onClick={() => setTheme("dark")}>
                Use dark
            </button>
        </>
    );
}

describe("ThemeProvider", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = "";
        vi.stubGlobal(
            "matchMedia",
            vi.fn().mockReturnValue({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })
        );
    });

    it("uses the persisted preference and applies it to the document", () => {
        localStorage.setItem("test-theme", "dark");

        render(
            <ThemeProvider storageKey="test-theme">
                <ThemeConsumer />
            </ThemeProvider>
        );

        expect(screen.getByText("dark")).toBeInTheDocument();
        expect(document.documentElement).toHaveClass("dark");
    });

    it("persists an explicit theme change", async () => {
        render(
            <ThemeProvider storageKey="test-theme" defaultTheme="light">
                <ThemeConsumer />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "Use dark" }));

        expect(localStorage.getItem("test-theme")).toBe("dark");
        await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    });

    it("resolves the system preference for document styling while retaining the system choice", () => {
        vi.stubGlobal(
            "matchMedia",
            vi.fn().mockReturnValue({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })
        );

        render(
            <ThemeProvider storageKey="test-theme" defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>
        );

        expect(screen.getByText("system")).toBeInTheDocument();
        expect(document.documentElement).toHaveClass("dark");
    });
});
