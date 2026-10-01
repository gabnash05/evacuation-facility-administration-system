import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/features/events/EventsTable", () => ({ EventsTable: () => <div /> }));
vi.mock("@/store/eventStore", () => ({
    useEventStore: () => ({
        events: [],
        loading: false,
        error: null,
        pagination: null,
        fetchEvents: vi.fn(),
        getEventDetails: vi.fn(),
    }),
}));
vi.mock("@/store/evacuationCenterStore", () => ({
    useEvacuationCenterStore: () => ({
        centers: [],
        loading: false,
        fetchAllCenters: vi.fn(),
        fetchCenterById: vi.fn(),
    }),
}));
vi.mock("@/store/authStore", () => ({
    useAuthStore: () => ({ user: { role: "volunteer", center_id: 2 } }),
}));

import { VolunteerDashboard } from "./VolunteerDashboard";

describe("VolunteerDashboard", () => {
    it("renders quick actions as buttons that preserve their navigation behavior", () => {
        render(<VolunteerDashboard />);

        fireEvent.click(screen.getByRole("button", { name: "Attendance" }));

        expect(navigate).toHaveBeenCalledWith("/volunteer/attendance");
        expect(screen.getByRole("button", { name: "Register Household" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Distribute Relief" })).toBeInTheDocument();
    });
});
