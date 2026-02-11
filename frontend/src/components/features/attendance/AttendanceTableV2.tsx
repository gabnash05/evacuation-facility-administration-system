import { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreVertical,
    LogOut,
    Move,
    Trash2,
    CheckCircle,
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

import { DeleteAttendanceDialog } from "./DeleteAttendanceDialog";
import { cn } from "@/lib/utils";

/* ---------------- types ---------------- */

export interface AttendanceRecord {
    record_id: number;
    individual_id: number;
    individual_name: string;
    full_name: string;
    age: string | number;
    gender: string;
    relationship_to_head: string;
    current_status: string;
    status: string;
    center_name: string;
    current_center_name: string;
    current_center_id?: number;
    household_name: string;
    household_id?: number;
    last_check_in_time: string;
    check_in_time?: string;
    can_check_out?: boolean;
    can_transfer?: boolean;
    event_name?: string;
    check_out_time?: string | null;
    transfer_time?: string | null;
}

export type SortConfig = {
    key: string;
    direction: "asc" | "desc" | null;
} | null;

interface AttendanceTableProps {
    data: AttendanceRecord[];
    headers: { key: string; label: string; sortable: boolean }[];
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    onCheckOut: (id: number) => void;
    onTransfer: (id: number) => void;
    onDelete: (id: number) => void;
    onCheckIn?: (individualId: number, record: AttendanceRecord) => void;
    loading?: boolean;
    userRole?: string;
    showActions?: (record: AttendanceRecord) => {
        canCheckOut: boolean;
        canTransfer: boolean;
        canCheckIn: boolean;
    };
}

/* ---------------- component ---------------- */

export function AttendanceTable({
    data,
    headers,
    sortConfig,
    onSort,
    onCheckOut,
    onTransfer,
    onDelete,
    onCheckIn,
    loading,
    userRole,
    showActions,
}: AttendanceTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<{
        id: number;
        individual: string;
    } | null>(null);

    /* -------- sort icon (same logic as other tables) -------- */

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || !sortConfig.direction)
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;

        if (sortConfig.direction === "asc")
            return <ChevronUp className="h-4 w-4" />;

        return <ChevronDown className="h-4 w-4" />;
    };

    /* -------- handlers -------- */

    const handleDeleteClick = (record: AttendanceRecord) => {
        setRecordToDelete({
            id: record.record_id,
            individual: record.individual_name,
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!recordToDelete) return;
        await onDelete(recordToDelete.id);
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
    };

    const handleCloseDialog = () => {
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
    };

    const isSuperAdmin = userRole === "super_admin";

    /* -------- empty state -------- */

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No individuals found.</div>
            </div>
        );
    }

    /* -------- status badge -------- */

    const getStatusBadge = (status: string) => {
        const statusMap: Record<
            string,
            { label: string; bg: string; text: string; border: string }
        > = {
            checked_in: {
                label: "Checked In",
                bg: "bg-chart-2/15",
                text: "text-chart-2",
                border: "border border-chart-2/30",
            },
            checked_out: {
                label: "Checked Out",
                bg: "bg-muted",
                text: "text-muted-foreground",
                border: "border border-border",
            },
            transferred: {
                label: "Transferred",
                bg: "bg-chart-5/15",
                text: "text-chart-5",
                border: "border border-chart-5/30",
            },
        };

        const cfg = statusMap[status] || {
            label: status
                ? status
                    .split("_")
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
                : "Unknown",
            bg: "bg-muted",
            text: "text-muted-foreground",
            border: "border border-border",
        };

        return (
            <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
                {cfg.label}
            </span>
        );
    };

    /* ---------------- render ---------------- */

    return (
        <>
            <div className="w-full overflow-visible">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {headers.map(header => (
                                <TableHead
                                    key={header.key}
                                    className={cn(
                                        "font-semibold py-3 text-foreground break-words whitespace-normal",
                                        header.sortable && "cursor-pointer hover:bg-muted"
                                    )}
                                    onClick={
                                        header.sortable
                                            ? () => onSort(header.key)
                                            : undefined
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{header.label}</span>
                                        {header.sortable && getSortIcon(header.key)}
                                    </div>
                                </TableHead>
                            ))}

                            {/* Actions column */}
                            <TableHead className="text-right font-semibold text-foreground w-24">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={headers.length + 1}
                                    className="h-32 text-center"
                                >
                                    <div className="text-muted-foreground">
                                        Loading individuals...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const actionState = showActions
                                    ? showActions(row)
                                    : {
                                          canCheckOut: row.can_check_out || false,
                                          canTransfer: row.can_transfer || false,
                                          canCheckIn: false,
                                      };

                                return (
                                    <TableRow
                                        key={row.record_id}
                                        className={cn(
                                            "hover:bg-muted/50 cursor-pointer",
                                            index % 2 === 1 && "bg-muted/30"
                                        )}
                                    >
                                        {headers.map(header => (
                                            <TableCell
                                                key={header.key}
                                                className="py-3 break-words whitespace-normal"
                                            >
                                                {header.key === "status" ? (
                                                    getStatusBadge(row.status)
                                                ) : header.key === "age" ? (
                                                    <span className="font-medium">
                                                        {row.age}
                                                    </span>
                                                ) : header.key ===
                                                  "last_check_in_time" ? (
                                                    typeof row.last_check_in_time ===
                                                        "string" &&
                                                    (row.last_check_in_time ===
                                                        "Never" ||
                                                        row.last_check_in_time.includes(
                                                            ","
                                                        )) ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {row.last_check_in_time}
                                                        </span>
                                                    ) : row.last_check_in_time ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                row.last_check_in_time
                                                            ).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Never
                                                        </span>
                                                    )
                                                ) : (
                                                    row[
                                                        header.key as keyof AttendanceRecord
                                                    ] || "—"
                                                )}
                                            </TableCell>
                                        ))}

                                        {/* Actions */}
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
                                                    {actionState.canCheckOut && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onCheckOut(
                                                                    row.record_id
                                                                )
                                                            }
                                                            className="flex items-center gap-2"
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                            Check Out
                                                        </DropdownMenuItem>
                                                    )}

                                                    {actionState.canTransfer && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onTransfer(
                                                                    row.record_id
                                                                )
                                                            }
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Move className="h-4 w-4" />
                                                            Transfer
                                                        </DropdownMenuItem>
                                                    )}

                                                    {actionState.canCheckIn &&
                                                        onCheckIn && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onCheckIn(
                                                                        row.individual_id,
                                                                        row
                                                                    )
                                                                }
                                                                className="flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                                Check In
                                                            </DropdownMenuItem>
                                                        )}

                                                    {isSuperAdmin && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    row
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
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Dialog */}
            <DeleteAttendanceDialog
                isOpen={deleteDialogOpen}
                onClose={handleCloseDialog}
                onConfirm={handleConfirmDelete}
                individualName={recordToDelete?.individual || ""}
                loading={loading}
            />
        </>
    );
}

export default AttendanceTable;
