import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DuplicateCenterDialog } from "./DuplicateCenterDialog";

describe("DuplicateCenterDialog", () => {
    it("identifies the duplicate center and dismisses through its acknowledgement", () => {
        const onClose = vi.fn();
        render(<DuplicateCenterDialog isOpen onClose={onClose} centerName="North Hall" />);

        expect(screen.getByRole("dialog")).toHaveTextContent('"North Hall"');
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
