"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { DeleteAidDialog } from "@/components/features/aid-allocation/DeleteAidDialog";

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
    showActions?: boolean;
    showTitle?: boolean;
    deleteLoading?: boolean;
    // NEW: Add user role prop
    userRole?: string; // "super_admin", "city_admin", "center_admin", "volunteer"
}

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
    showActions = true,
    showTitle = true,
    deleteLoading = false,
    userRole = "city_admin", // Default to city_admin for safety
}: AidDistributionTableProps) {
    // Determine if delete button should be shown based on user role
    const showDeleteButton = userRole === "super_admin";
    
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        allocation: null as any,
    });

    const handleOpenDeleteDialog = (allocation: any, event: React.MouseEvent) => {
        event.stopPropagation();
        setDeleteDialog({
            isOpen: true,
            allocation
        });
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
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

    // Helper function to get searchable text for a cell
    const getSearchableText = (key: string, value: any, row: any): string => {
        if (key === "created_at") {
            return formatDate(value).toLowerCase();
        }

        if (key === "status") {
            return value?.toLowerCase() || "";
        }
        
        if (key === "distribution_type") {
            return formatDistributionType(value).toLowerCase();
        }
        
        if (key === "remaining_quantity") {
            const total = row.total_quantity || 0;
            const remaining = value || 0;
            return `${remaining}/${total}`;
        }
        
        return String(value || "").toLowerCase();
    };

    const defaultRenderCell = (key: string, value: any, row: any) => {
        if (key === "created_at") {
            return formatDate(value);
        }

        if (key === "status") {
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                    {value?.charAt(0).toUpperCase() + value?.slice(1) || "Unknown"}
                </span>
            );
        }
        
        if (key === "distribution_type") {
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDistributionTypeColor(value)}`}>
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
                    <span className="font-medium">{remaining} / {total}</span>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                            className={`h-2 rounded-full ${
                                percentage > 50 ? "bg-green-600" : 
                                percentage > 20 ? "bg-yellow-600" : 
                                "bg-red-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{percentage}% remaining</span>
                </div>
            );
        }
        
        return value;
    };

    const getSortIcon = (columnKey: string) => {
        if (sortColumn !== columnKey) {
            return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }
        
        return sortDirection === "desc" ? (
            <ChevronDown className="h-4 w-4 ml-1 text-600" />
        ) : (
            <ChevronUp className="h-4 w-4 ml-1 text-600" />
        );
    };

    return (
        <>
            <div className="border border-border border-t-0">
                {showTitle && title && (
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-base text-foreground">{title}</h3>
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(column => (
                                <TableHead key={column.key} className={column.className || ""}>
                                    {column.sortable !== false && onSort ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => onSort(column.key)}
                                            className="h-8 px-2 hover:bg-transparent font-semibold w-full justify-start p-0"
                                        >
                                            {column.label}
                                            {getSortIcon(column.key)}
                                        </Button>
                                    ) : (
                                        column.label
                                    )}
                                </TableHead>
                            ))}
                            {showActions && (
                                <TableHead className="text-right">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (showActions ? 1 : 0)} 
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No aid distribution records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, i) => (
                                <TableRow
                                    key={i}
                                    className={`${i % 2 === 1 ? "bg-muted/50" : ""} ${
                                        onRowClick
                                            ? "cursor-pointer hover:bg-muted/50 transition-colors"
                                            : ""
                                    }`}
                                    onClick={() => onRowClick?.(row, i)}
                                >
                                    {columns.map(column => (
                                        <TableCell
                                            key={column.key}
                                            className={`${
                                                column.key === columns[0].key ? "font-medium" : ""
                                            } ${column.className || ""}`}
                                            title={
                                                column.className?.includes("truncate")
                                                    ? getSearchableText(column.key, row[column.key], row)
                                                    : undefined
                                            }
                                        >
                                            {renderCell
                                                ? renderCell(column.key, row[column.key], row)
                                                : defaultRenderCell(column.key, row[column.key], row)}
                                        </TableCell>
                                    ))}
                                    {showActions && (
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {onEdit && (
                                                        <DropdownMenuItem 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit(row);
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {/* Only show delete for super_admin */}
                                                    {showDeleteButton && onDelete && (
                                                        <DropdownMenuItem 
                                                            onClick={(e) => handleOpenDeleteDialog(row, e)}
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Aid Allocation Dialog - Only needed if delete button is shown */}
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