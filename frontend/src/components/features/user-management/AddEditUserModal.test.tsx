import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchAllCenters = vi.fn();

async function loadModal() {
    vi.resetModules();
    vi.doMock("@/store/evacuationCenterStore", () => ({
        useEvacuationCenterStore: () => ({
            centers: [{ center_id: 7, center_name: "North Center" }],
            fetchAllCenters,
        }),
    }));
    vi.doMock("@/store/authStore", () => ({
        useAuthStore: () => ({ user: null }),
    }));
    vi.doMock("@/store/userStore", () => ({
        useUserStore: () => ({ createUser: vi.fn(), updateUser: vi.fn() }),
    }));

    return import("./AddEditUserModal");
}

afterEach(() => {
    fetchAllCenters.mockClear();
    vi.doUnmock("@/store/evacuationCenterStore");
    vi.doUnmock("@/store/authStore");
    vi.doUnmock("@/store/userStore");
    vi.resetModules();
});

describe("AddEditUserModal", () => {
    it("describes account creation and names the role selector", async () => {
        const { AddEditUserModal } = await loadModal();

        render(<AddEditUserModal isOpen onClose={vi.fn()} currentUserRole="city_admin" />);

        expect(screen.getByRole("dialog", { name: "Add New User" })).toHaveTextContent(
            "Fill in the details to create a new user account."
        );
        expect(screen.getByRole("combobox", { name: "User role" })).toBeEnabled();
        expect(fetchAllCenters).toHaveBeenCalledOnce();
    });
});
