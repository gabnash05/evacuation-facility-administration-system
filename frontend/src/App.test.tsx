import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@/components/features/auth/ProtectedRoute", () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/layouts/MainLayout", () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("./pages/city-admin/CityAdminAttendancePageV2", () => ({
    CityAdminAttendancePage: () => <h1>City attendance</h1>,
}));
vi.mock("./pages/center-admin/CenterAdminAttendancePageV2", () => ({
    CenterAdminAttendancePage: () => <h1>Center attendance</h1>,
}));
vi.mock("./pages/volunteer/VolunteerAttendancePageV2", () => ({
    VolunteerAttendancePage: () => <h1>Volunteer attendance</h1>,
}));

describe("App", () => {
    beforeEach(() => {
        window.history.replaceState({}, "", "/login");
    });

    it("renders the public login route", () => {
        render(<App />);

        expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("renders the public unauthorized route", () => {
        window.history.replaceState({}, "", "/unauthorized");
        render(<App />);

        expect(screen.getByText("Unauthorized Access")).toBeInTheDocument();
    });

    it.each([
        ["/city-admin/attendance", "City attendance"],
        ["/center-admin/attendance", "Center attendance"],
        ["/volunteer/attendance", "Volunteer attendance"],
    ])("routes %s to the maintained attendance page", (url, heading) => {
        window.history.replaceState({}, "", url);
        render(<App />);

        expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
});
