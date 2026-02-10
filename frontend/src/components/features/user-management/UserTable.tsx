"use client";

import { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreVertical,
    Edit,
    Trash2,
    Users,
    Building,
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

interface UserTableProps {
    data: User[];
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    onSort: (key: string) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onDeactivate?: (user: User) => void;
    loading?: boolean;
    userRole?: string;
}

/* ---------------- helpers ---------------- */

const getSortIcon = (
    sortConfig: UserTableProps["sortConfig"],
    key: string
) => {
    if (!sortConfig || sortConfig.key !== key || !sortConfig.direction) {
        return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (sortConfig.direction === "asc") {
        return <ChevronUp className="h-4 w-4" />;
    }

    return <ChevronDown className="h-4 w-4" />;
};

const getRoleStyles = (role: string) => {
    switch (role.toLowerCase()) {
        case "super_admin":
            return "bg-purple-100 text-purple-700 border-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-900";
        case "city_admin":
            return "bg-blue-100 text-blue-700 border-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-900";
        case "center_admin":
            return "bg-orange-100 text-orange-700 border-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-900";
        case "volunteer":
            return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
        default:
            return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
    }
};

const getStatusStyles = (isActive: boolean) => {
    return isActive
        ? "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900"
        : "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
};

const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
        case "super_admin":
            return <Users className="h-3 w-3 mr-1" />;
        case "city_admin":
        case "center_admin":
            return <Building className="h-3 w-3 mr-1" />;
        case "volunteer":
            return <Users className="h-3 w-3 mr-1" />;
        default:
            return <Users className="h-3 w-3 mr-1" />;
    }
};

/* ---------------- component ---------------- */

export function UserTable({
    data,
    sortConfig,
    onSort,
    onEdit,
    onDelete,
    onDeactivate,
    loading,
    userRole,
}: UserTableProps) {
    const canDelete = userRole === "super_admin";

    /* -------- empty state -------- */

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No users found.</div>
            </div>
        );
    }

    /* ---------------- render ---------------- */

    return (
        <div className="w-full overflow-visible">
            <Table className="table-fixed w-full">
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead
                            className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                            onClick={() => onSort("email")}
                        >
                            <div className="flex items-center justify-between break-words whitespace-normal">
                                <span>Email</span>
                                {getSortIcon(sortConfig, "email")}
                            </div>
                        </TableHead>

                        <TableHead
                            className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                            onClick={() => onSort("role")}
                        >
                            <div className="flex items-center justify-between break-words whitespace-normal">
                                <span>Role</span>
                                {getSortIcon(sortConfig, "role")}
                            </div>
                        </TableHead>

                        <TableHead
                            className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                            onClick={() => onSort("center_name")}
                        >
                            <div className="flex items-center justify-between break-words whitespace-normal">
                                <span>Assigned Center</span>
                                {getSortIcon(sortConfig, "center_name")}
                            </div>
                        </TableHead>

                        <TableHead
                            className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                            onClick={() => onSort("is_active")}
                        >
                            <div className="flex items-center justify-between break-words whitespace-normal">
                                <span>Status</span>
                                {getSortIcon(sortConfig, "is_active")}
                            </div>
                        </TableHead>

                        <TableHead className="text-right font-semibold text-foreground w-24">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading && data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                                <div className="text-muted-foreground">
                                    Loading users...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((user, index) => (
                            <TableRow
                                key={user.user_id}
                                className={cn(
                                    "hover:bg-muted/50 cursor-pointer",
                                    index % 2 === 1 && "bg-muted/30"
                                )}
                            >
                                <TableCell className="py-3 font-medium break-words whitespace-normal">
                                    {user.email}
                                </TableCell>

                                <TableCell className="py-3">
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            getRoleStyles(user.role),
                                            "truncate max-w-full inline-block capitalize"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            {getRoleIcon(user.role)}
                                            {user.role.replace("_", " ")}
                                        </div>
                                    </Badge>
                                </TableCell>

                                <TableCell className="py-3 break-words whitespace-normal">
                                    {user.center_name || (
                                        <span className="text-muted-foreground italic">
                                            Not assigned
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="py-3">
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            getStatusStyles(user.is_active),
                                            "truncate max-w-full inline-block break-words whitespace-normal"
                                        )}
                                    >
                                        {user.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>

                                <TableCell
                                    className="text-right w-24 break-words whitespace-normal"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => onEdit(user)}
                                                className="flex items-center gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>

                                            {onDeactivate && (
                                                <DropdownMenuItem
                                                    onClick={() => onDeactivate(user)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Users className="h-4 w-4" />
                                                    {user.is_active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </DropdownMenuItem>
                                            )}

                                            {canDelete && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(user)}
                                                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
