import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransferReasonSelect } from "./TransferReasonSelect";

describe("TransferReasonSelect", () => {
    it("names the control and displays its controlled value", () => {
        render(<TransferReasonSelect value="family_request" onChange={vi.fn()} />);

        expect(screen.getByRole("combobox", { name: "Transfer reason" })).toHaveTextContent(
            "Family Request"
        );
    });

    it("prevents selection while disabled", () => {
        render(<TransferReasonSelect value="family_request" onChange={vi.fn()} disabled />);

        expect(screen.getByRole("combobox", { name: "Transfer reason" })).toBeDisabled();
    });
});
