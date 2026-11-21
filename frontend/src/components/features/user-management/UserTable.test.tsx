import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const user = {
    user_id: 3,
    email: "volunteer@example.test",
    role: "volunteer" as const,
    center_id: 7,
    center_name: "North Center",
    is_active: true,
};

async function loadUserTable() {
    vi.resetModules();
    vi.doMock("@/components/ui/dropdown-menu", () => ({
        DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
        DropdownMenuContent: ({ children }: { children: ReactNode }) => (
            <div role="menu">{children}</div>
        ),
        DropdownMenuItem: ({
            children,
            onClick,
            className,
        }: {
            children: ReactNode;
            onClick: () => void;
            className?: string;
        }) => (
            <button type="button" role="menuitem" className={className} onClick={onClick}>
                {children}
            </button>
        ),
        DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    }));

    return import("./UserTable");
}

afterEach(() => {
    vi.doUnmock("@/components/ui/dropdown-menu");
    vi.resetModules();
});

async function renderTable(userRole: "super_admin" | "city_admin" = "city_admin") {
    const onSort = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDeactivate = vi.fn();
    const { UserTable } = await loadUserTable();

    render(
        <UserTable
            data={[user]}
            sortConfig={{ key: "email", direction: "asc" }}
            onSort={onSort}
            onEdit={onEdit}
            onDelete={onDelete}
            onDeactivate={onDeactivate}
            userRole={userRole}
        />
    );

    return { onSort, onEdit, onDelete, onDeactivate };
}

describe("UserTable", () => {
    it("uses accessible sort buttons and reports the active sort direction", async () => {
        const { onSort } = await renderTable();

        expect(screen.getByRole("columnheader", { name: "Email" })).toHaveAttribute(
            "aria-sort",
            "ascending"
        );
        fireEvent.click(screen.getByRole("button", { name: "Email" }));
        expect(onSort).toHaveBeenCalledWith("email");
    });

    it("names each row action menu and keeps destructive actions role-scoped", async () => {
        const { onEdit, onDeactivate } = await renderTable();

        expect(
            screen.getByRole("button", { name: "Open actions for volunteer@example.test" })
        ).toBeEnabled();
        fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
        fireEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));

        expect(onEdit).toHaveBeenCalledWith(user);
        expect(onDeactivate).toHaveBeenCalledWith(user);
        expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    });

    it("offers deletion only to a super admin", async () => {
        const { onDelete } = await renderTable("super_admin");

        fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

        expect(onDelete).toHaveBeenCalledWith(user);
    });
});
