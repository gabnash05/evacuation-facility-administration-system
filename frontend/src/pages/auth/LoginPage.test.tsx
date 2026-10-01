import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
    it("keeps invalid credentials on the client and explains each required correction", () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: "Login" }));

        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
});
