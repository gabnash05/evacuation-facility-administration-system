// components/features/events/EventsTable.tsx
"use client";

import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreVertical,
    SquarePen,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import type { Event } from "@/types/event";

interface EventsTableProps {
    data: Event[];
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    onSort: (key: string) => void;
    loading?: boolean;
    onEdit: (event: Event) => void;
    onDelete: (event: Event) => void;
    onRowClick: (event: Event) => void;
}

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "NA";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper function to capitalize status for display
const capitalizeStatus = (status: string | undefined): string => {
    if (!status) return "Active";
    const normalized = status.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

// Custom dropdown component for actions
function ActionDropdown({
    event,
    onEdit,
    onDelete,
}: {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete: (event: Event) => void;
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
        onEdit(event);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onDelete(event);
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
                            <SquarePen className="h-4 w-4" />
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

export function EventsTable({
    data,
    sortConfig,
    onSort,
    loading,
    onEdit,
    onDelete,
    onRowClick,
}: EventsTableProps) {
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

    const getStatusColor = (status: string | undefined) => {
        const displayStatus = capitalizeStatus(status);
        switch (displayStatus) {
            case "Active":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            case "Monitoring":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "Resolved":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    // Calculate usage percentage for an event
    const calculateUsage = (event: Event): number => {
        if (!event.capacity || event.capacity === 0) return 0;
        return Math.round((event.max_occupancy / event.capacity) * 100);
    };

    // Get display percentage (capped at 100% for visual representation)
    const getDisplayPercentage = (event: Event): number => {
        const usagePercentage = calculateUsage(event);
        return Math.min(usagePercentage, 100); // Cap at 100% for visual bar
    };

    const columnWidths = {
        event_name: "180px",
        event_type: "150px",
        date_declared: "120px",
        end_date: "120px",
        capacity: "100px",
        max_occupancy: "120px",
        usage_percentage: "140px",
        status: "100px",
        actions: "100px",
    };

    const headers = [
        {
            key: "event_name",
            label: "Event Name",
            sortable: true,
            width: columnWidths.event_name,
        },
        {
            key: "event_type",
            label: "Event Type",
            sortable: true,
            width: columnWidths.event_type,
        },
        {
            key: "date_declared",
            label: "Date Declared",
            sortable: true,
            width: columnWidths.date_declared,
        },
        {
            key: "end_date",
            label: "End Date",
            sortable: true,
            width: columnWidths.end_date,
        },
        {
            key: "capacity",
            label: "Capacity",
            sortable: true,
            width: columnWidths.capacity,
        },
        {
            key: "max_occupancy",
            label: "Max Occupancy",
            sortable: true,
            width: columnWidths.max_occupancy,
        },
        {
            key: "usage_percentage",
            label: "Usage %",
            sortable: true,
            width: columnWidths.usage_percentage,
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            width: columnWidths.status,
        },
        {
            key: "actions",
            label: "Action",
            sortable: false,
            width: columnWidths.actions,
        },
    ];

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
                                colSpan={headers.length}
                                className="h-32 text-center"
                                style={{ width: "100%" }}
                            >
                                <div className="text-muted-foreground flex flex-col items-center justify-center">
                                    <div className="text-lg font-medium mb-2">No events found</div>
                                    <div className="text-sm">
                                        Add your first event to get started
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((event, index) => {
                            const usagePercentage = calculateUsage(event);
                            const displayPercentage = getDisplayPercentage(event);

                            return (
                                <TableRow
                                    key={event.event_id}
                                    className={cn(
                                        "hover:bg-muted/50 transition-colors cursor-pointer",
                                        index % 2 === 1 ? "bg-muted/50" : ""
                                    )}
                                    onClick={() => onRowClick(event)}
                                >
                                    <TableCell
                                        className="font-medium py-3 truncate align-middle text-left"
                                        style={{ width: columnWidths.event_name }}
                                        title={event.event_name}
                                    >
                                        {event.event_name}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 truncate align-middle text-left"
                                        style={{ width: columnWidths.event_type }}
                                        title={event.event_type}
                                    >
                                        {event.event_type}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.date_declared }}
                                    >
                                        {formatDateForDisplay(event.date_declared)}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.end_date }}
                                    >
                                        {event.end_date ? formatDateForDisplay(event.end_date) : "NA"}
                                    </TableCell>
                                    {/* Capacity and Occupancy Columns */}
                                    <TableCell
                                        className="py-3 align-middle text-right"
                                        style={{ width: columnWidths.capacity }}
                                    >
                                        {(event.capacity || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-right"
                                        style={{ width: columnWidths.max_occupancy }}
                                    >
                                        {(event.max_occupancy || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.usage_percentage }}
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
                                                getStatusColor(event.status),
                                                "truncate max-w-full inline-block"
                                            )}
                                        >
                                            {capitalizeStatus(event.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-middle text-left"
                                        style={{ width: columnWidths.actions }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ActionDropdown
                                            event={event}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}