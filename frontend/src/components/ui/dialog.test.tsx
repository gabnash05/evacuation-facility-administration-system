import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

describe("Dialog", () => {
    it("opens a labelled modal dialog and closes through its built-in control", () => {
        render(
            <Dialog>
                <DialogTrigger>Open attendance details</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Attendance details</DialogTitle>
                    <DialogDescription>Review the active attendance record.</DialogDescription>
                </DialogContent>
            </Dialog>
        );

        fireEvent.click(screen.getByRole("button", { name: "Open attendance details" }));

        expect(screen.getByRole("dialog", { name: "Attendance details" })).toHaveTextContent(
            "Review the active attendance record."
        );

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("supports intentionally omitting the built-in close control", () => {
        render(
            <Dialog open>
                <DialogContent showCloseButton={false}>
                    <DialogTitle>Read-only details</DialogTitle>
                    <DialogDescription>Details cannot be changed here.</DialogDescription>
                </DialogContent>
            </Dialog>
        );

        expect(screen.getByRole("dialog", { name: "Read-only details" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
});
