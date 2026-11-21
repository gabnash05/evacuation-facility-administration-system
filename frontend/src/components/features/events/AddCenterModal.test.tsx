import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const center = {
    center_id: 7,
    center_name: "North Center",
    address: "North Road",
    status: "active",
    capacity: 100,
    current_occupancy: 20,
};

const fetchAllCenters = vi.fn();

async function loadModal() {
    vi.resetModules();
    vi.doMock("@/store/evacuationCenterStore", () => ({
        useEvacuationCenterStore: () => ({
            centers: [center],
            loading: false,
            error: null,
            fetchAllCenters,
        }),
    }));

    return import("./AddCenterModal");
}

afterEach(() => {
    fetchAllCenters.mockClear();
    vi.doUnmock("@/store/evacuationCenterStore");
    vi.resetModules();
});

describe("AddCenterModal", () => {
    it("describes selection, excludes existing centers, and submits selected centers", async () => {
        const onClose = vi.fn();
        const onAddCenters = vi.fn();
        const { AddCenterModal } = await loadModal();

        render(
            <AddCenterModal
                isOpen
                onClose={onClose}
                onAddCenters={onAddCenters}
                existingCenters={[]}
            />
        );

        expect(screen.getByRole("dialog", { name: "Add Center" })).toHaveTextContent(
            "Select available evacuation centers to associate with this event."
        );
        expect(fetchAllCenters).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByRole("button", { name: "Add North Center" }));
        fireEvent.click(screen.getByRole("button", { name: "Add Centers (1)" }));

        expect(onAddCenters).toHaveBeenCalledWith([center]);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not offer centers that are already associated", async () => {
        const { AddCenterModal } = await loadModal();

        render(
            <AddCenterModal
                isOpen
                onClose={vi.fn()}
                onAddCenters={vi.fn()}
                existingCenters={[center]}
            />
        );

        expect(
            screen.getByText("All available centers are already added to this event")
        ).toBeVisible();
        expect(screen.queryByRole("button", { name: "Add North Center" })).not.toBeInTheDocument();
    });
});
