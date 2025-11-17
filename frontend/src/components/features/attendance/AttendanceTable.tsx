import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical, LogOut, Move, Trash2 } from "lucide-react";
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

export interface AttendanceRecord {
    record_id: number;
    individual_name: string;
    center_name: string;
    event_name: string;
    household_name: string;
    status: string;
    check_in_time: string;
    check_out_time: string;
    transfer_time: string;
    notes?: string;
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
    loading?: boolean;
    userRole?: string;
}

export function AttendanceTable({
    data,
    headers,
    sortConfig,
    onSort,
    onCheckOut,
    onTransfer,
    onDelete,
    loading,
    userRole,
}: AttendanceTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<{ id: number; individual: string } | null>(
        null
    );

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || !sortConfig.direction)
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        if (sortConfig.direction === "asc") return <ChevronUp className="h-4 w-4" />;
        return <ChevronDown className="h-4 w-4" />;
    };

    const handleDeleteClick = (record: AttendanceRecord) => {
        setRecordToDelete({
            id: record.record_id,
            individual: record.individual_name,
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (recordToDelete) {
            await onDelete(recordToDelete.id);
            setDeleteDialogOpen(false);
            setRecordToDelete(null);
        }
    };

    const handleCloseDialog = () => {
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
    };

    // Check if user can perform actions (adjust based on your role requirements)
    const canManage = userRole === "super_admin" || userRole === "city_admin" || userRole === "center_admin";

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No attendance records found.</div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case "checked_in":
                return `${baseClasses} bg-green-100 text-green-800`;
            case "checked_out":
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case "transferred":
                return `${baseClasses} bg-orange-100 text-orange-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    return (
        <>
            <div className="w-full">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {headers.map(header => (
                                <TableHead
                                    key={header.key}
                                    className={cn(
                                        "font-semibold text-foreground",
                                        header.sortable && "cursor-pointer hover:bg-muted"
                                    )}
                                    onClick={header.sortable ? () => onSort(header.key) : undefined}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{header.label}</span>
                                        {header.sortable && getSortIcon(header.key)}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead className="text-right font-semibold text-foreground">
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
                                        Loading attendance records...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow
                                    key={row.record_id}
                                    className={cn(
                                        "hover:bg-muted/50",
                                        index % 2 === 1 && "bg-muted/30"
                                    )}
                                >
                                    {headers.map(header => (
                                        <TableCell key={header.key} className="py-3">
                                            {header.key === "status" ? (
                                                <span className={getStatusBadge(row.status)}>
                                                    {row.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            ) : (
                                                row[header.key as keyof AttendanceRecord]
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
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
                                                {row.status === "checked_in" && (
                                                    <DropdownMenuItem
                                                        onClick={() => onCheckOut(row.record_id)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        Check Out
                                                    </DropdownMenuItem>
                                                )}
                                                {row.status === "checked_in" && (
                                                    <DropdownMenuItem
                                                        onClick={() => onTransfer(row.record_id)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Move className="h-4 w-4" />
                                                        Transfer
                                                    </DropdownMenuItem>
                                                )}
                                                {canManage && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(row)}
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

            {/* Delete Confirmation Dialog */}
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