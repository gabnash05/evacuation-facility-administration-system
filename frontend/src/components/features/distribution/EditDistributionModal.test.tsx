import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Allocation } from "@/types/distribution";
import { useDistributionStore } from "@/store/distributionStore";
import { EditDistributionModal } from "./EditDistributionModal";

vi.mock("@/store/authStore", () => ({ useAuthStore: () => ({ user: { role: "super_admin" } }) }));
vi.mock("@/store/distributionStore", () => ({ useDistributionStore: vi.fn() }));

describe("EditDistributionModal", () => {
    const store = {
        centers: [],
        households: [],
        getCenterAllocations: vi.fn(),
        setSelectedCenterId: vi.fn(),
        resetSelectedCenter: vi.fn(),
        clearError: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useDistributionStore).mockReturnValue({ ...store, selectedCenterId: 3 });
        store.getCenterAllocations.mockResolvedValue([]);
    });

    it("loads allocation options on opening and guards incomplete submissions", async () => {
        const onClose = vi.fn();
        const { rerender } = render(
            <EditDistributionModal isOpen={false} onClose={onClose} record={null} />
        );
        expect(store.getCenterAllocations).not.toHaveBeenCalled();

        rerender(<EditDistributionModal isOpen onClose={onClose} record={null} />);
        expect(screen.getByRole("dialog", { name: "Edit Distribution" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Update Distribution" })).toBeDisabled();
        expect(store.getCenterAllocations).toHaveBeenCalledExactlyOnceWith(3);
        await act(async () => {});
    });

    it("keeps the current center loading when an earlier request finishes", async () => {
        const requests = new Map<number, (options: Allocation[]) => void>();
        store.getCenterAllocations.mockImplementation(
            (id: number) => new Promise(resolve => requests.set(id, resolve))
        );
        const onClose = vi.fn();
        const { rerender } = render(
            <EditDistributionModal isOpen onClose={onClose} record={null} />
        );
        vi.mocked(useDistributionStore).mockReturnValue({ ...store, selectedCenterId: 4 });
        rerender(<EditDistributionModal isOpen onClose={onClose} record={null} />);
        expect(store.getCenterAllocations).toHaveBeenLastCalledWith(4);

        await act(async () => {
            requests.get(3)?.([]);
        });
        expect(screen.getAllByText("Loading items...").length).toBeGreaterThan(0);

        await act(async () => {
            requests.get(4)?.([]);
        });
        expect(screen.queryByText("Loading items...")).not.toBeInTheDocument();
    });
});
