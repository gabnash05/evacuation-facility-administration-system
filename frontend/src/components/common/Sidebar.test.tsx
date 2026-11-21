import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
    auth: { logout: vi.fn(), isLoggingOut: false },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("./ModeToggle", () => ({
    ModeToggle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/ui/sidebar", () => ({
    Sidebar: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
    SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
    SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
}));

import { AppSidebar } from "./Sidebar";

function LocationProbe() {
    return <span data-testid="location">{useLocation().pathname}</span>;
}

describe("AppSidebar", () => {
    it("navigates to login after a successful logout", async () => {
        auth.isLoggingOut = false;
        auth.logout.mockResolvedValue(undefined);

        render(
            <MemoryRouter initialEntries={["/volunteer/dashboard"]}>
                <AppSidebar
                    role="volunteer"
                    roleLabel="Volunteer"
                    userEmail="volunteer@example.test"
                />
                <LocationProbe />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: "Logout" }));

        await vi.waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
        expect(auth.logout).toHaveBeenCalledTimes(1);
    });

    it("prevents a duplicate logout while logout is already in progress", () => {
        auth.isLoggingOut = true;

        render(
            <MemoryRouter>
                <AppSidebar role="volunteer" roleLabel="Volunteer" />
            </MemoryRouter>
        );

        expect(screen.getByRole("button", { name: "Logging out..." })).toBeDisabled();
    });
});
