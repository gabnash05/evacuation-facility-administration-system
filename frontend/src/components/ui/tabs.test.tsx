import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
    it("exposes tab state and switches the visible panel", () => {
        render(
            <Tabs defaultValue="current">
                <TabsList aria-label="Attendance views">
                    <TabsTrigger value="current">Current</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="current">Current attendance</TabsContent>
                <TabsContent value="history">Attendance history</TabsContent>
            </Tabs>
        );

        expect(screen.getByRole("tab", { name: "Current" })).toHaveAttribute(
            "aria-selected",
            "true"
        );
        expect(screen.getByText("Current attendance")).toBeVisible();
        expect(screen.queryByText("Attendance history")).not.toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole("tab", { name: "History" }), {
            button: 0,
            ctrlKey: false,
        });

        expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
            "aria-selected",
            "true"
        );
        expect(screen.getByText("Attendance history")).toBeVisible();
    });
});
