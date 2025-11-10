// evacuation-facility-administration-system/frontend/src/components/features/evacuation-center/EvacuationCenterTable.tsx
"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";
import type { EvacuationCenter } from "@/types/center";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useState, useRef, useEffect } from "react";
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
}

// Custom dropdown component with theme support and proper positioning
function ActionDropdown({
    centerId,
    centerName,
    onEdit,
    onDelete,
}: {
    centerId: number;
    centerName: string;
    onEdit: (id: number) => void;
    onDelete: (id: number, name: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownContentRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reposition dropdown when opened or when scrolling
    useEffect(() => {
        if (!isOpen || !dropdownRef.current || !dropdownContentRef.current) return;

        const updatePosition = () => {
            const triggerRect = dropdownRef.current!.getBoundingClientRect();
            const dropdownContent = dropdownContentRef.current!;

            // Calculate position relative to the trigger
            let top = triggerRect.bottom;
            let left = triggerRect.right - 132; // 132 = dropdown width (128) + some offset

            // Adjust if dropdown would go off-screen to the right
            if (left + 132 > window.innerWidth) {
                left = window.innerWidth - 132 - 8; // 8px margin from edge
            }

            // Adjust if dropdown would go off-screen to the bottom
            if (top + dropdownContent.offsetHeight > window.innerHeight) {
                top = triggerRect.top - dropdownContent.offsetHeight;
            }

            dropdownContent.style.top = `${top}px`;
            dropdownContent.style.left = `${left}px`;
        };

        updatePosition();

        // Update position on scroll and resize
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onEdit(centerId);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onDelete(centerId, centerName);
    };

    return (
        <div ref={dropdownRef} className="relative inline-block">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleButtonClick}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
                    <div
                        ref={dropdownContentRef}
                        className="absolute bg-popover text-popover-foreground border border-border rounded-md shadow-lg w-32"
                        style={{
                            pointerEvents: "auto",
                        }}
                    >
                        <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-sm"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 rounded-sm text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to capitalize the first letter
const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export function EvacuationCenterTable({
    data,
    sortConfig,
    onSort,
    loading,
    onShowSuccessToast,
    onRowClick,
    onItemDeleted,
}: EvacuationCenterTableProps) {
    const { deleteCenter } = useEvacuationCenterStore();
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        centerId: number | null;
        centerName: string;
    }>({
        isOpen: false,
        centerId: null,
        centerName: "",
    });
    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        center: EvacuationCenter | null;
    }>({
        isOpen: false,
        center: null,
    });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        switch (sortConfig.direction) {
            case "asc":
                return <ChevronUp className="h-4 w-4" />;
            case "desc":
                return <ChevronDown className="h-4 w-4" />;
            case null:
            default:
                return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
    };

    // Calculate usage percentage for a center
    const calculateUsage = (center: EvacuationCenter): number => {
        if (center.capacity === 0) return 0;
        return Math.round((center.current_occupancy / center.capacity) * 100);
    };

    // Get display percentage (capped at 100% for visual representation)
    const getDisplayPercentage = (center: EvacuationCenter): number => {
        const usagePercentage = calculateUsage(center);
        return Math.min(usagePercentage, 100); // Cap at 100% for visual bar
    };

    const columnWidths = {
        center_name: "220px",
        address: "280px",
        capacity: "120px",
        current_occupancy: "130px",
        usage: "140px",
        status: "120px",
        actions: "100px",
    };

    const headers = [
        {
            key: "center_name",
            label: "Center Name",
            sortable: true,
            width: columnWidths.center_name,
        },
        { key: "address", label: "Address", sortable: true, width: columnWidths.address },
        { key: "capacity", label: "Capacity", sortable: true, width: columnWidths.capacity },
        {
            key: "current_occupancy",
            label: "Current Occupancy",
            sortable: true,
            width: columnWidths.current_occupancy,
        },
        { key: "usage", label: "Usage", sortable: true, width: columnWidths.usage },
        { key: "status", label: "Status", sortable: true, width: columnWidths.status },
        { key: "actions", label: "Action", sortable: false, width: columnWidths.actions },
    ];

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

    const handleDeleteClick = (centerId: number, centerName: string) => {
        setDeleteDialog({
            isOpen: true,
            centerId,
            centerName,
        });
    };

    const handleEditClick = (centerId: number) => {
        const centerToEdit = data.find(center => center.center_id === centerId);
        if (centerToEdit) {
            setEditDialog({
                isOpen: true,
                center: centerToEdit,
            });
        }
    };

    const handleRowClick = (center: EvacuationCenter) => {
        if (onRowClick) {
            onRowClick(center);
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteDialog.centerId) {
            setDeleteLoading(true);
            try {
                await deleteCenter(deleteDialog.centerId);
                setDeleteDialog({
                    isOpen: false,
                    centerId: null,
                    centerName: "",
                });

                if (onShowSuccessToast) {
                    onShowSuccessToast("Evacuation center deleted successfully.");
                }

                if (onItemDeleted) {
                    onItemDeleted();
                }
            } catch (error) {
                console.error("Failed to delete center:", error);
            } finally {
                setDeleteLoading(false);
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({
            isOpen: false,
            centerId: null,
            centerName: "",
        });
    };

    const handleEditClose = () => {
        setEditDialog({
            isOpen: false,
            center: null,
        });
    };

    return (
        <div className="w-full overflow-visible">
            <Table className="table-fixed w-full">
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {headers.map(header => (
                            <TableHead
                                key={header.key}
                                className={cn(
                                    header.sortable && "cursor-pointer hover:bg-muted",
                                    "font-semibold py-3 text-left"
                                )}
                                style={{ width: header.width }}
                                onClick={header.sortable ? () => onSort(header.key) : undefined}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="truncate block font-medium">
                                        {header.label}
                                    </span>
                                    {header.sortable && (
                                        <span className="flex-shrink-0 ml-2">
                                            {getSortIcon(header.key)}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 && !loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-32 text-center"
                                style={{ width: "100%" }}
                            >
                                <div className="text-muted-foreground flex flex-col items-center justify-center">
                                    <div className="text-lg font-medium mb-2">
                                        No evacuation centers found
                                    </div>
                                    <div className="text-sm">
                                        Add your first evacuation center to get started
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((center, index) => {
                            const usagePercentage = calculateUsage(center);
                            const displayPercentage = getDisplayPercentage(center);

                            return (
                                <TableRow
                                    key={center.center_id}
                                    className={cn(
                                        "hover:bg-muted/50 transition-colors",
                                        index % 2 === 1 ? "bg-muted/50" : ""
                                    )}
                                    onClick={() => handleRowClick(center)}
                                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                                >
                                    <TableCell
                                        className="font-medium py-3 truncate align-middle text-left"
                                        style={{ width: columnWidths.center_name }}
                                        title={center.center_name}
                                    >
                                        {center.center_name}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 truncate align-middle text-left"
                                        style={{ width: columnWidths.address }}
                                        title={center.address}
                                    >
                                        {center.address}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.capacity }}
                                    >
                                        {center.capacity.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.current_occupancy }}
                                    >
                                        {center.current_occupancy.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.usage }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-300 dark:bg-secondary rounded-full h-2 flex-shrink-0 border border-gray-400 dark:border-border">
                                                <div
                                                    className={cn(
                                                        "h-2 rounded-full",
                                                        usagePercentage >= 100
                                                            ? "bg-red-600" // Special color for overcapacity
                                                            : usagePercentage >= 80
                                                              ? "bg-red-500"
                                                              : usagePercentage >= 60
                                                                ? "bg-yellow-500"
                                                                : "bg-green-500"
                                                    )}
                                                    style={{ width: `${displayPercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium whitespace-nowrap">
                                                {usagePercentage}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.status }}
                                    >
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
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.actions }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ActionDropdown
                                            centerId={center.center_id}
                                            centerName={center.center_name}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteClick}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <DeleteCenterDialog
                isOpen={deleteDialog.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                centerName={deleteDialog.centerName}
                loading={deleteLoading}
            />

            {/* Edit Center Dialog */}
            <EditEvacuationCenterForm
                isOpen={editDialog.isOpen}
                onClose={handleEditClose}
                center={editDialog.center}
                onShowSuccessToast={onShowSuccessToast}
            />
        </div>
    );
}
