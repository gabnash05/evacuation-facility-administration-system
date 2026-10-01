import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

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
});
