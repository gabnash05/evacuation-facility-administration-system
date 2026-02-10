"use client";

import { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreVertical,
    Edit,
    Trash2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { EvacuationCenter } from "@/types/center";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";

import { DeleteCenterDialog } from "./DeleteCenterDialog";
import { EditEvacuationCenterForm } from "./EditEvacuationCenterForm";

interface EvacuationCenterTableProps {
    data: EvacuationCenter[];
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    onSort: (key: string) => void;
    loading?: boolean;
    onShowSuccessToast?: (message: string) => void;
    onRowClick?: (center: EvacuationCenter) => void;
    onItemDeleted?: () => void;
    userRole?: string;
}

/* ---------------- helpers ---------------- */

const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
        case "active":
        case "open":
            return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
        case "inactive":
            return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
        case "closed":
            return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
        default:
            return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
    }
};

/* ---------------- component ---------------- */

export function EvacuationCenterTable({
    data,
    sortConfig,
    onSort,
    loading,
    onShowSuccessToast,
    onRowClick,
    onItemDeleted,
    userRole,
}: EvacuationCenterTableProps) {
    const { deleteCenter } = useEvacuationCenterStore();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [centerToDelete, setCenterToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        center: EvacuationCenter | null;
    }>({
        isOpen: false,
        center: null,
    });

    /* -------- sort icon (same logic as HouseholdTable) -------- */

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || !sortConfig.direction)
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;

        if (sortConfig.direction === "asc")
            return <ChevronUp className="h-4 w-4" />;

        return <ChevronDown className="h-4 w-4" />;
    };

    /* -------- permissions -------- */

    const canDelete = userRole === "super_admin";

    /* -------- handlers -------- */

    const handleDeleteClick = (center: EvacuationCenter) => {
        setCenterToDelete({
            id: center.center_id,
            name: center.center_name,
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!centerToDelete) return;

        try {
            await deleteCenter(centerToDelete.id);

            setDeleteDialogOpen(false);
            setCenterToDelete(null);

            onShowSuccessToast?.("Evacuation center deleted successfully.");
            onItemDeleted?.();
        } catch (error) {
            // Consider adding an error toast callback prop or using a toast library directly
            console.error("Failed to delete evacuation center:", error);
        }
    };
    const handleCloseDialog = () => {
        setDeleteDialogOpen(false);
        setCenterToDelete(null);
    };

    const handleEdit = (center: EvacuationCenter) => {
        setEditDialog({
            isOpen: true,
            center,
        });
    };

    const handleEditClose = () => {
        setEditDialog({
            isOpen: false,
            center: null,
        });
    };

    /* -------- empty state (same layout pattern) -------- */

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No evacuation centers found.</div>
            </div>
        );
    }

    /* ---------------- render ---------------- */

    return (
        <>
            <div className="w-full overflow-visible">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead
                                className="font-semibold p-3 text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => onSort("center_name")}
                            >
                                <div className="flex items-center justify-between break-words whitespace-normal">
                                    <span>Center Name</span>
                                    {getSortIcon("center_name")}
                                </div>
                            </TableHead>

                            <TableHead
                                className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => onSort("address")}
                            >
                                <div className="flex items-center justify-between break-words whitespace-normal">
                                    <span>Address</span>
                                    {getSortIcon("address")}
                                </div>
                            </TableHead>

                            <TableHead
                                className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => onSort("capacity")}
                            >
                                <div className="flex items-center justify-between break-words whitespace-normal">
                                    <span>Capacity</span>
                                    {getSortIcon("capacity")}
                                </div>
                            </TableHead>

                            <TableHead
                                className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => onSort("current_occupancy")}
                            >
                                <div className="flex items-center justify-between break-words whitespace-normal">
                                    <span>Occupancy</span>
                                    {getSortIcon("current_occupancy")}
                                </div>
                            </TableHead>

                            <TableHead
                                className="font-semibold text-foreground cursor-pointer hover:bg-muted"
                                onClick={() => onSort("status")}
                            >
                                <div className="flex items-center justify-between break-words whitespace-normal">
                                    <span>Status</span>
                                    {getSortIcon("status")}
                                </div>
                            </TableHead>

                            <TableHead className="text-right font-semibold text-foreground w-24 break-words whitespace-normal">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center ">
                                    <div className="text-muted-foreground">
                                        Loading evacuation centers...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((center, index) => (
                                <TableRow
                                    key={center.center_id}
                                    className={cn(
                                        "hover:bg-muted/50 cursor-pointer",
                                        index % 2 === 1 && "bg-muted/30"
                                    )}
                                    onClick={() => onRowClick?.(center)}
                                >
                                    <TableCell className="py-3 font-medium break-words whitespace-normal">
                                        {center.center_name}
                                    </TableCell>

                                    <TableCell className="py-3 break-words whitespace-normal">
                                        {center.address}
                                    </TableCell>

                                    <TableCell className="py-3 break-words whitespace-normal">
                                        {center.capacity.toLocaleString()}
                                    </TableCell>

                                    <TableCell className="py-3 break-words whitespace-normal">
                                        {center.current_occupancy.toLocaleString()}
                                    </TableCell>

                                    <TableCell className="py-3 break-words whitespace-normal">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                getStatusStyles(center.status),
                                                "truncate max-w-full inline-block"
                                            )}
                                        >
                                            {capitalizeFirstLetter(center.status)}
                                        </Badge>
                                    </TableCell>

                                    <TableCell
                                        className="text-right w-24"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleEdit(center)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>

                                                {canDelete && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(center)}
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

            {/* Delete Dialog */}
            <DeleteCenterDialog
                isOpen={deleteDialogOpen}
                onClose={handleCloseDialog}
                onConfirm={handleConfirmDelete}
                centerName={centerToDelete?.name || ""}
                loading={loading}
            />

            {/* Edit Dialog */}
            <EditEvacuationCenterForm
                isOpen={editDialog.isOpen}
                onClose={handleEditClose}
                center={editDialog.center}
                onShowSuccessToast={onShowSuccessToast}
            />
        </>
    );
}
