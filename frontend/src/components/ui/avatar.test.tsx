import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback } from "./avatar";

describe("Avatar", () => {
    it("renders fallback content inside the avatar root", () => {
        render(
            <Avatar>
                <AvatarFallback>AS</AvatarFallback>
            </Avatar>
        );

        expect(screen.getByText("AS")).toHaveAttribute("data-slot", "avatar-fallback");
        expect(screen.getByText("AS").parentElement).toHaveAttribute("data-slot", "avatar");
    });
});
