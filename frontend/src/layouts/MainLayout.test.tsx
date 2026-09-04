import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MainLayout from "./MainLayout";

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        user: { email: "admin@example.test", role: "city_admin" },
        isLoading: false,
    }),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/components/common/Sidebar", () => ({ AppSidebar: () => <aside /> }));
vi.mock("@/components/common/Topbar", () => ({ default: () => <header /> }));
vi.mock("@/components/ui/sidebar", () => ({
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SidebarTrigger: () => <button type="button">Toggle sidebar</button>,
}));

describe("MainLayout", () => {
    it("uses flexible main content sizing instead of a device-specific viewport calculation", () => {
        render(
            <MainLayout>
                <p>Dashboard content</p>
            </MainLayout>
        );

        const main = screen.getByRole("main");
        expect(main).toHaveTextContent("Dashboard content");
        expect(main.className).not.toContain("calc(100vw-21vw)");
        expect(main.className).toContain("min-w-0");
    });
});
