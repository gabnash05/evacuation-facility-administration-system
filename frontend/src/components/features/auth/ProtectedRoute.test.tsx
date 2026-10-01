import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
    auth: {
        isAuthenticated: false,
        isLoading: false,
        user: null as { role: string } | null,
    },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));

import ProtectedRoute from "./ProtectedRoute";

function renderRoute(requiredRole?: string[]) {
    return render(
        <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute requiredRole={requiredRole}>
                            <div>Protected content</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login page</div>} />
                <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedRoute", () => {
    beforeEach(() => {
        auth.isAuthenticated = false;
        auth.isLoading = false;
        auth.user = null;
    });

    it("shows a loading state while authentication is unresolved", () => {
        auth.isLoading = true;

        renderRoute();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("redirects an unauthenticated visitor to login", () => {
        renderRoute();

        expect(screen.getByText("Login page")).toBeInTheDocument();
    });

    it("redirects authenticated users lacking the required role", () => {
        auth.isAuthenticated = true;
        auth.user = { role: "volunteer" };

        renderRoute(["city_admin"]);

        expect(screen.getByText("Unauthorized page")).toBeInTheDocument();
    });

    it("renders protected content for an allowed role", () => {
        auth.isAuthenticated = true;
        auth.user = { role: "city_admin" };

        renderRoute(["city_admin"]);

        expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
});
