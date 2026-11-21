import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mobile } = vi.hoisted(() => ({ mobile: { value: false } }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mobile.value }));

import { SidebarProvider, SidebarTrigger, useSidebar } from "./sidebar";

function SidebarState() {
    const { state, openMobile } = useSidebar();
    return (
        <output data-testid="sidebar-state">
            {state}:{openMobile ? "mobile-open" : "mobile-closed"}
        </output>
    );
}

describe("sidebar", () => {
    beforeEach(() => {
        mobile.value = false;
        document.cookie = "sidebar_state=; path=/; max-age=0";
    });

    it("toggles the desktop sidebar with its button and keyboard shortcut", () => {
        render(
            <SidebarProvider>
                <SidebarState />
                <SidebarTrigger />
            </SidebarProvider>
        );

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded:mobile-closed");
        fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed:mobile-closed");
        expect(document.cookie).toContain("sidebar_state=false");

        fireEvent.keyDown(window, { key: "b", ctrlKey: true });
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded:mobile-closed");
        expect(document.cookie).toContain("sidebar_state=true");
    });

    it("reports controlled changes without overriding the supplied state", () => {
        const onOpenChange = vi.fn();
        const { rerender } = render(
            <SidebarProvider open onOpenChange={onOpenChange}>
                <SidebarState />
                <SidebarTrigger />
            </SidebarProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded:mobile-closed");

        rerender(
            <SidebarProvider open={false} onOpenChange={onOpenChange}>
                <SidebarState />
                <SidebarTrigger />
            </SidebarProvider>
        );
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed:mobile-closed");
    });

    it("opens mobile navigation without collapsing the desktop state", () => {
        mobile.value = true;
        render(
            <SidebarProvider>
                <SidebarState />
                <SidebarTrigger />
            </SidebarProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded:mobile-open");
        expect(document.cookie).not.toContain("sidebar_state=");
    });
});
