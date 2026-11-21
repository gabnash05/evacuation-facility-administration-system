import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDistributionStore } from "@/store/distributionStore";
import { CityAdminDistributionPage } from "./CityAdminDistributionPage";

vi.mock("@/store/authStore", () => ({ useAuthStore: () => ({ user: { role: "city_admin" } }) }));
vi.mock("@/store/distributionStore", () => ({ useDistributionStore: vi.fn() }));
vi.mock("@/components/features/distribution/DistributeAidModal", () => ({
    DistributeAidModal: () => null,
}));
vi.mock("@/components/features/distribution/EditDistributionModal", () => ({
    EditDistributionModal: () => null,
}));

describe("CityAdminDistributionPage", () => {
    const store = {
        history: [],
        searchQuery: "",
        fetchData: vi.fn(),
        currentPage: 1,
        entriesPerPage: 10,
        error: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useDistributionStore).mockReturnValue(store);
    });

    it("loads citywide history and shows an empty result when the request succeeds", () => {
        render(<CityAdminDistributionPage />);

        expect(store.fetchData).toHaveBeenCalledTimes(1);
        expect(screen.getByText("No distribution records found.")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("announces a failed history load instead of presenting it as an empty result", () => {
        vi.mocked(useDistributionStore).mockReturnValue({
            ...store,
            error: "Failed to load distribution history. Please try again.",
        });
        render(<CityAdminDistributionPage />);

        expect(screen.getByRole("alert")).toHaveTextContent("Failed to load distribution history");
        expect(screen.queryByText("No distribution records found.")).not.toBeInTheDocument();
    });
});
