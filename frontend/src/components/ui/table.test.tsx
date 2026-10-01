import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";

describe("Table", () => {
    it("preserves semantic table regions and caller properties", () => {
        render(
            <Table aria-label="Center capacity" className="custom-table">
                <TableCaption>Current center capacity</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead scope="col">Center</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>North Center</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Total: 42</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByRole("table", { name: "Center capacity" })).toHaveClass("custom-table");
        expect(screen.getByRole("columnheader", { name: "Center" })).toHaveAttribute(
            "scope",
            "col"
        );
        expect(screen.getByRole("cell", { name: "North Center" })).toHaveAttribute(
            "data-slot",
            "table-cell"
        );
        expect(screen.getByText("Current center capacity")).toHaveAttribute(
            "data-slot",
            "table-caption"
        );
        expect(screen.getByText("Total: 42")).toHaveAttribute("data-slot", "table-cell");
    });
});
