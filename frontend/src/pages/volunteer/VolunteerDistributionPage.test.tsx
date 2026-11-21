import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useDistributionStore } from "@/store/distributionStore";
import { VolunteerDistributionPage } from "./VolunteerDistributionPage";

const { fetchCenterById } = vi.hoisted(() => ({ fetchCenterById: vi.fn() }));
vi.mock("@/store/authStore", () => ({ useAuthStore: vi.fn() }));
vi.mock("@/store/distributionStore", () => ({ useDistributionStore: vi.fn() }));
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({ fetchCenterById }),
}));
vi.mock("@/components/features/distribution/DistributeAidModal", () => ({
    DistributeAidModal: () => null,
}));
vi.mock("@/components/features/distribution/EditDistributionModal", () => ({
    EditDistributionModal: () => null,
}));

describe("VolunteerDistributionPage", () => {
    const store = {
        history: [],
        searchQuery: "",
        fetchData: vi.fn(),
        clearError: vi.fn(),
        currentPage: 1,
        entriesPerPage: 10,
    };
    const assignCenter = (center_id: number | null) => {
        vi.mocked(useAuthStore).mockReturnValue({ user: { role: "volunteer", center_id } });
    };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useDistributionStore).mockReturnValue(store);
        fetchCenterById.mockImplementation(async (id: number) => ({
            center_name: id === 3 ? "North Center" : "South Center",
        }));
    });

    it("blocks history and center requests without an assigned center", () => {
        assignCenter(null);
        render(<VolunteerDistributionPage />);

        expect(
            screen.getByText(/have not been assigned to an evacuation center/)
        ).toBeInTheDocument();
        expect(store.fetchData).not.toHaveBeenCalled();
        expect(fetchCenterById).not.toHaveBeenCalled();
    });

    it("refreshes history and the center name when the assigned center changes", async () => {
        assignCenter(3);
        const { rerender } = render(<VolunteerDistributionPage />);
        await waitFor(() => expect(screen.getByText(/North Center/)).toBeInTheDocument());
        expect(store.fetchData).toHaveBeenCalledTimes(1);

        assignCenter(4);
        rerender(<VolunteerDistributionPage />);
        await waitFor(() => expect(screen.getByText(/South Center/)).toBeInTheDocument());
        expect(store.fetchData).toHaveBeenCalledTimes(2);
        expect(fetchCenterById).toHaveBeenLastCalledWith(4);
    });
});
