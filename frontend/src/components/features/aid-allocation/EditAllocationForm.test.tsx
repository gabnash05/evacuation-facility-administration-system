import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { EditAllocationForm } from "./EditAllocationForm";

vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{children}</button>
    ),
}));

vi.mock("@/components/ui/input", () => ({
    Input: forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
        (props, ref) => <input ref={ref} {...props} />,
    ),
}));

vi.mock("@/components/ui/label", () => ({
    Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
        <label {...props}>{children}</label>
    ),
}));

vi.mock("@/components/ui/select", () => ({
    Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectTrigger: forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
        ({ children, ...props }, ref) => <button ref={ref} {...props}>{children}</button>,
    ),
    SelectValue: () => null,
}));

vi.mock("@/services/aidAllocationService", () => ({
    AidAllocationService: { getCategories: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}));
vi.mock("@/services/evacuationCenterService", () => ({
    EvacuationCenterService: { getCenters: vi.fn().mockResolvedValue({ success: true, data: { results: [] } }) },
}));
vi.mock("@/services/eventService", () => ({
    EventService: { getEvents: vi.fn().mockResolvedValue({ success: true, data: { results: [] } }) },
}));

describe("EditAllocationForm", () => {
    it("submits mutable fields only and never browser-derived remaining quantity", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const allocation = {
            allocation_id: 31,
            center_id: 4,
            category_id: 2,
            event_id: 9,
            resource_name: "Water",
            total_quantity: 100,
            remaining_quantity: 60,
            distribution_type: "per_household",
            status: "active",
        };

        render(<EditAllocationForm isOpen onClose={vi.fn()} onSubmit={onSubmit} allocation={allocation} />);
        fireEvent.change(screen.getByLabelText("Total Quantity"), { target: { value: "120" } });
        fireEvent.click(screen.getByRole("button", { name: "Update Allocation" }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith(31, {
            resource_name: "Water",
            total_quantity: 120,
            distribution_type: "per_household",
            status: "active",
            category_id: 2,
        });
        expect(onSubmit.mock.calls[0][1]).not.toHaveProperty("remaining_quantity");
    });
});
