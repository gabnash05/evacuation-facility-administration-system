import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Topbar from "./Topbar";

describe("Topbar", () => {
    it("exposes the supplied page title as the page heading", () => {
        render(<Topbar title="Evacuation centers" />);

        expect(
            screen.getByRole("heading", { level: 1, name: "Evacuation centers" })
        ).toBeInTheDocument();
        expect(screen.getByRole("banner")).toBeInTheDocument();
    });
});
