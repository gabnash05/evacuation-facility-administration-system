"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    ChevronsUpDown,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Trash2,
    Edit,
    AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { DeleteAidDialog } from "@/components/features/aid-allocation/DeleteAidDialog";

/* ---------------- types ---------------- */

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
}

interface AidDistributionTableProps {
    title?: string;
    columns: Column[];
    data: any[];
    onRowClick?: (row: any, index: number) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    renderCell?: (key: string, value: any, row: any) => React.ReactNode;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    onDistribute?: (row: any) => void;
    onCancel?: (row: any) => void;
    showActions?: boolean;
    showTitle?: boolean;
    deleteLoading?: boolean;
    userRole?: string;
}

/* ---------------- component ---------------- */

export function AidDistributionTable({
    title,
    columns,
    data,
    onRowClick,
    onSort,
    sortColumn,
    sortDirection,
    renderCell,
    onEdit,
    onDelete,
    onCancel,
    showActions = true,
    showTitle = true,
    deleteLoading = false,
    userRole = "city_admin",
}: AidDistributionTableProps) {
    const showDeleteButton = userRole === "super_admin";

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        allocation: any;
    }>({
        isOpen: false,
        allocation: null,
    });

    /* -------- dialog handlers -------- */

    const handleOpenDeleteDialog = (allocation: any, event: React.MouseEvent) => {
        event.stopPropagation();
        setDeleteDialog({ isOpen: true, allocation });
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, allocation: null });
    };

    const handleConfirmDelete = () => {
        if (deleteDialog.allocation && onDelete) {
            onDelete(deleteDialog.allocation);
            handleCloseDeleteDialog();
        }
    };

    /* -------- formatting helpers -------- */

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "delivered":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            case "active":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
            case "depleted":
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
            case "cancelled":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const getDistributionTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case "per_household":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200";
            case "per_individual":
                return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const formatDistributionType = (type: string) => {
        switch (type?.toLowerCase()) {
            case "per_household":
                return "Per Household";
            case "per_individual":
                return "Per Individual";
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "Invalid Date";
        }
    };

    const defaultRenderCell = (key: string, value: any, row: any) => {
        if (key === "created_at") {
            return formatDate(value);
        }

        if (key === "status") {
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        value
                    )}`}
                >
                    {value?.charAt(0).toUpperCase() + value?.slice(1) || "Unknown"}
                </span>
            );
        }

        if (key === "distribution_type") {
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDistributionTypeColor(
                        value
                    )}`}
                >
                    {formatDistributionType(value)}
                </span>
            );
        }

        if (key === "remaining_quantity") {
            const total = row.total_quantity || 0;
            const remaining = value || 0;
            const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;

            return (
                <div className="flex flex-col gap-1">
                    <span className="font-medium">
                        {remaining} / {total}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                            className={`h-2 rounded-full ${
                                percentage > 50
                                    ? "bg-green-600"
                                    : percentage > 20
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {percentage}% remaining
                    </span>
                </div>
            );
        }

        return value;
    };

    /* -------- sort icon -------- */

    const getSortIcon = (columnKey: string) => {
        if (sortColumn !== columnKey) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        return sortDirection === "desc" ? (
            <ChevronDown className="h-4 w-4" />
        ) : (
            <ChevronUp className="h-4 w-4" />
        );
    };

    /* -------- empty state -------- */

    if (data.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">
                    No aid distribution records found
                </div>
            </div>
        );
    }

    /* ---------------- render ---------------- */

    return (
        <>
            <div className="w-full overflow-visible">
                {showTitle && title && (
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-base text-foreground">
                            {title}
                        </h3>
                    </div>
                )}

                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {columns.map(column => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        "font-semibold py-3 text-foreground break-words whitespace-normal",
                                        column.sortable !== false &&
                                            onSort &&
                                            "cursor-pointer hover:bg-muted"
                                    )}
                                    onClick={
                                        column.sortable !== false && onSort
                                            ? () => onSort(column.key)
                                            : undefined
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{column.label}</span>
                                        {column.sortable !== false &&
                                            onSort &&
                                            getSortIcon(column.key)}
                                    </div>
                                </TableHead>
                            ))}

                            {showActions && (
                                <TableHead className="text-right font-semibold text-foreground w-24">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow
                                key={i}
                                className={cn(
                                    "hover:bg-muted/50",
                                    i % 2 === 1 && "bg-muted/30",
                                    onRowClick && "cursor-pointer"
                                )}
                                onClick={() => onRowClick?.(row, i)}
                            >
                                {columns.map(column => (
                                    <TableCell
                                        key={column.key}
                                        className={cn(
                                            "py-3 break-words whitespace-normal",
                                            column.key === columns[0].key &&
                                                "font-medium",
                                            column.className
                                        )}
                                    >
                                        {renderCell
                                            ? renderCell(
                                                  column.key,
                                                  row[column.key],
                                                  row
                                              )
                                            : defaultRenderCell(
                                                  column.key,
                                                  row[column.key],
                                                  row
                                              )}
                                    </TableCell>
                                ))}

                                {showActions && (
                                    <TableCell
                                        className="text-right w-24"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={e =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                {userRole === "super_admin" &&
                                                    onEdit && (
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onEdit(row);
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}

                                                {userRole === "city_admin" &&
                                                    onCancel &&
                                                    (row.status?.toLowerCase() ===
                                                        "active" ||
                                                        row.status?.toLowerCase() ===
                                                            "depleted") && (
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onCancel(row);
                                                            }}
                                                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    )}

                                                {userRole === "super_admin" &&
                                                    onDelete && (
                                                        <DropdownMenuItem
                                                            onClick={e =>
                                                                handleOpenDeleteDialog(
                                                                    row,
                                                                    e
                                                                )
                                                            }
                                                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Dialog */}
            {showDeleteButton && (
                <DeleteAidDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    allocationName={deleteDialog.allocation?.resource_name || ""}
                    loading={deleteLoading}
                />
            )}
        </>
    );
}
