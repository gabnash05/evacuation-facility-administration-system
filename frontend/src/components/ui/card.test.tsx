import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./card";

describe("Card", () => {
    it("composes named card regions and forwards caller properties", () => {
        render(
            <Card aria-label="Evacuation center summary" className="custom-card">
                <CardHeader>
                    <CardTitle>North Center</CardTitle>
                    <CardDescription>Open</CardDescription>
                    <CardAction>Actions</CardAction>
                </CardHeader>
                <CardContent>42 occupants</CardContent>
                <CardFooter>Updated today</CardFooter>
            </Card>
        );

        expect(screen.getByLabelText("Evacuation center summary")).toHaveClass("custom-card");
        expect(screen.getByText("North Center")).toHaveAttribute("data-slot", "card-title");
        expect(screen.getByText("Open")).toHaveAttribute("data-slot", "card-description");
        expect(screen.getByText("Actions")).toHaveAttribute("data-slot", "card-action");
        expect(screen.getByText("42 occupants")).toHaveAttribute("data-slot", "card-content");
        expect(screen.getByText("Updated today")).toHaveAttribute("data-slot", "card-footer");
    });
});
