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

interface Event {
    event_id: number;
    event_name: string;
    event_type: string;
    date_declared: string;
    end_date?: string | null;
    status: "active" | "monitoring" | "resolved";
    created_at: string;
    updated_at?: string;
}

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

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

// Helper function to capitalize status for display
const capitalizeStatus = (status: string): "Active" | "Monitoring" | "Resolved" => {
    const statusMap: Record<string, "Active" | "Monitoring" | "Resolved"> = {
        active: "Active",
        monitoring: "Monitoring",
        resolved: "Resolved",
    };
    return statusMap[status.toLowerCase()] || "Active";
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

    const getStatusColor = (status: string) => {
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

    const columnWidths = {
        event_name: "220px",
        event_type: "180px",
        date_declared: "140px",
        end_date: "140px",
        status: "120px",
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
                        data.map((event, index) => (
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
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
