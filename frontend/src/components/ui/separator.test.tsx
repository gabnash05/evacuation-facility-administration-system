import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "./separator";

describe("Separator", () => {
    it("renders a semantic vertical separator when non-decorative", () => {
        const { getByRole } = render(<Separator orientation="vertical" decorative={false} />);

        expect(getByRole("separator")).toHaveAttribute("data-orientation", "vertical");
    });
});
