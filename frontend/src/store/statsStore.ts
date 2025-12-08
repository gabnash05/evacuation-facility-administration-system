import { create } from "zustand";
import { StatsService } from "@/services/statsService";
import type {
    DashboardStats,
    StatsFilter,
    Gender,
    AgeGroup,
    StatDisplay,
} from "@/types/stats";

interface StatsState {
    stats: DashboardStats | null;
    loading: boolean;
    error: string | null;
    filters: StatsFilter;

    // Actions
    setFilters: (filters: StatsFilter) => void;
    setGenderFilter: (gender: Gender | null) => void;
    setAgeGroupFilter: (ageGroup: AgeGroup | null) => void;
    fetchStats: (centerId?: number) => Promise<void>;
    resetFilters: () => void;
    getStatsForDisplay: () => StatDisplay[];
}

const initialState = {
    stats: null,
    loading: false,
    error: null,
    filters: {
        gender: null,
        age_group: null,
        center_id: null,
    },
};

export const useStatsStore = create<StatsState>((set, get) => ({
    ...initialState,

    setFilters: (filters: StatsFilter) => {
        set({ filters });
    },

    setGenderFilter: (gender: Gender | null) => {
        const currentFilters = get().filters;
        set({
            filters: {
                ...currentFilters,
                gender,
            },
        });
    },

    setAgeGroupFilter: (ageGroup: AgeGroup | null) => {
        const currentFilters = get().filters;
        set({
            filters: {
                ...currentFilters,
                age_group: ageGroup,
            },
        });
    },

    fetchStats: async (centerId?: number) => {
        const { filters } = get();

        set({ loading: true, error: null });

        try {
            const filterParams: StatsFilter = {
                gender: filters.gender,
                age_group: filters.age_group,
                center_id: centerId || filters.center_id,
            };

            const response = await StatsService.getDashboardStats(filterParams);

            if (response.success) {
                set({
                    stats: response.data,
                    loading: false,
                });
            } else {
                set({
                    error: "Failed to fetch statistics",
                    loading: false,
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch statistics",
                loading: false,
            });
        }
    },

    resetFilters: () => {
        set({
            filters: {
                gender: null,
                age_group: null,
                center_id: null,
            },
        });
    },

    getStatsForDisplay: (): StatDisplay[] => {
        const { stats } = get();

        if (!stats) {
            return [
                {
                    label: "Occupancy Utilization Rate",
                    value: "0",
                    max: "0",
                    percentage: 0,
                },
                {
                    label: "Registration Penetration",
                    value: "0",
                    max: "0",
                    percentage: 0,
                },
                {
                    label: "Aid Distribution Efficiency",
                    value: "0",
                    max: "0",
                    percentage: 0,
                },
            ];
        }

        return [
            {
                label: "Occupancy Utilization Rate",
                value: stats.occupancy_stats.current_occupancy.toString(),
                max: stats.occupancy_stats.total_capacity.toString(),
                percentage: Math.round(stats.occupancy_stats.percentage),
            },
            {
                label: "Registration Penetration",
                value: stats.registration_stats.total_check_ins.toString(),
                max: stats.registration_stats.total_registered.toString(),
                percentage: Math.round(stats.registration_stats.percentage),
            },
            {
                label: "Aid Distribution Efficiency",
                value: stats.aid_distribution_stats.total_distributed.toString(),
                max: stats.aid_distribution_stats.total_allocated.toString(),
                percentage: Math.round(stats.aid_distribution_stats.percentage),
            },
        ];
    },
}));