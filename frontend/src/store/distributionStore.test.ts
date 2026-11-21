import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDistributionStore } from "./distributionStore";

const mocks = vi.hoisted(() => ({
    authState: vi.fn(),
    getHouseholds: vi.fn(),
    getHistory: vi.fn(),
    getAllocations: vi.fn(),
    getCenterAllocations: vi.fn(),
    getCenterById: vi.fn(),
    getCenters: vi.fn(),
}));

vi.mock("./authStore", () => ({ useAuthStore: { getState: mocks.authState } }));
vi.mock("@/services/api", () => ({ api: {} }));
vi.mock("@/services/householdService", () => ({
    HouseholdService: { getHouseholds: mocks.getHouseholds },
}));
vi.mock("@/services/distributionService", () => ({
    DistributionService: { getHistory: mocks.getHistory, getAllocations: mocks.getAllocations },
}));
vi.mock("@/services/aidAllocationService", () => ({
    AidAllocationService: { getCenterAllocations: mocks.getCenterAllocations },
}));
vi.mock("@/services/evacuationCenterService", () => ({
    EvacuationCenterService: { getCenterById: mocks.getCenterById, getCenters: mocks.getCenters },
}));

describe("distribution store center scope", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        useDistributionStore.getState().resetState();
        const emptyPage = { data: { results: [] } };
        mocks.getHouseholds.mockResolvedValue(emptyPage);
        mocks.getHistory.mockResolvedValue(emptyPage);
        mocks.getCenterAllocations.mockResolvedValue(emptyPage);
        mocks.getAllocations.mockResolvedValue(emptyPage);
        mocks.getCenterById.mockResolvedValue({ success: true, data: { center_id: 7 } });
        mocks.getCenters.mockResolvedValue(emptyPage);
    });

    it.each([null, 99])("uses the assigned center when the stored selection is %s", async id => {
        mocks.authState.mockReturnValue({ user: { role: "volunteer", center_id: 7 } });
        const store = useDistributionStore.getState();
        store.setSelectedCenterId(id);

        await store.fetchData();

        expect(mocks.getCenterById).toHaveBeenCalledExactlyOnceWith(7);
        expect(mocks.getHouseholds).toHaveBeenCalledExactlyOnceWith({ limit: 100, centerId: 7 });
        expect(mocks.getHistory).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ center_id: 7 })
        );
        expect(mocks.getCenterAllocations).toHaveBeenCalledExactlyOnceWith(7, {
            status: "active",
            limit: 100,
        });
        expect(mocks.getAllocations).not.toHaveBeenCalled();
        expect(useDistributionStore.getState().selectedCenterId).toBe(7);
    });

    it("clears stale scope and stops before loading data for an unassigned center admin", async () => {
        mocks.authState.mockReturnValue({ user: { role: "center_admin", center_id: null } });
        const store = useDistributionStore.getState();
        store.setSelectedCenterId(99);

        await store.fetchData();

        expect(mocks.getCenterById).not.toHaveBeenCalled();
        expect(mocks.getCenters).not.toHaveBeenCalled();
        expect(mocks.getHouseholds).not.toHaveBeenCalled();
        expect(mocks.getHistory).not.toHaveBeenCalled();
        expect(mocks.getAllocations).not.toHaveBeenCalled();
        expect(useDistributionStore.getState()).toMatchObject({
            selectedCenterId: null,
            history: [],
            isLoading: false,
            error: "No evacuation center assigned.",
        });
    });

    it("preserves citywide history and a selected center for allocation options", async () => {
        mocks.authState.mockReturnValue({ user: { role: "city_admin" } });
        const store = useDistributionStore.getState();
        store.setSelectedCenterId(9);

        await store.fetchData();

        expect(mocks.getCenters).toHaveBeenCalledExactlyOnceWith({ limit: 100 });
        expect(mocks.getHistory).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ center_id: undefined })
        );
        expect(mocks.getHouseholds).toHaveBeenCalledExactlyOnceWith({ limit: 100, centerId: 9 });
        expect(mocks.getCenterAllocations).toHaveBeenCalledExactlyOnceWith(9, {
            status: "active",
            limit: 100,
        });
    });
});
