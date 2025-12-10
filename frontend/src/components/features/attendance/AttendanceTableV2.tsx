import { useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    MoreVertical,
    LogOut,
    Move,
    Trash2,
    CheckCircle
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
    loading?: boolean;
    userRole?: string;
    showActions?: (record: AttendanceRecord) => {
        canCheckOut: boolean;
        canTransfer: boolean;
        canCheckIn: boolean;
    };
    onCheckIn?: (individualId: number, record: AttendanceRecord) => void;
}

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
    const [recordToDelete, setRecordToDelete] = useState<{ id: number; individual: string } | null>(
        null
    );

    // Update getSortIcon function to properly show active sort
    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || sortConfig.direction === null) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        
        if (sortConfig.direction === "asc") {
            return <ChevronUp className="h-4 w-4" />;
        }
        
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

    // Only show delete for super_admin
    const isSuperAdmin = userRole === "super_admin";

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No individuals found.</div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        // Status map with clean labels and colors
        const statusMap: Record<string, { label: string, bg: string, text: string, border: string }> = {
            "checked_in": {
                label: "Checked In",
                bg: "bg-green-100",
                text: "text-green-800",
                border: "border border-green-200"
            },
            "checked_out": {
                label: "Checked Out",
                bg: "bg-gray-100",
                text: "text-gray-800",
                border: "border border-gray-200"
            },
            "transferred": {
                label: "Transferred",
                bg: "bg-orange-100",
                text: "text-orange-800",
                border: "border border-orange-200"
            }
        };
        
        // Get status config or create default
        const statusConfig = statusMap[status] || {
            label: status 
                ? status
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                : 'Unknown',
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border border-gray-200"
        };
        
        return (
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                {statusConfig.label}
            </span>
        );
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
                                        Loading individuals...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                // Determine if actions should be shown
                                const actionState = showActions ? showActions(row) : {
                                    canCheckOut: row.can_check_out || false,
                                    canTransfer: row.can_transfer || false,
                                    canCheckIn: false,
                                };

                                return (
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
                                                    getStatusBadge(row.status)
                                                ) : header.key === "age" ? (
                                                    <span className="font-medium">{row.age}</span>
                                                ) : header.key === "last_check_in_time" ? (
                                                    // Check if it's already formatted (from our mapping)
                                                    typeof row.last_check_in_time === 'string' && 
                                                    (row.last_check_in_time === "Never" || row.last_check_in_time.includes(",")) ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {row.last_check_in_time}
                                                        </span>
                                                    ) : row.last_check_in_time ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(row.last_check_in_time).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Never</span>
                                                    )
                                                ) : header.key === "current_status" || header.key === "current_center_name" ? (
                                                    // Handle center name and status display
                                                    <span>
                                                        {row[header.key as keyof AttendanceRecord] || "—"}
                                                    </span>
                                                ) : (
                                                    // Default display
                                                    row[header.key as keyof AttendanceRecord] || "—"
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
                                                    {actionState.canCheckOut && (
                                                        <DropdownMenuItem
                                                            onClick={() => onCheckOut(row.record_id)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                            Check Out
                                                        </DropdownMenuItem>
                                                    )}
                                                    {actionState.canTransfer && (
                                                        <DropdownMenuItem
                                                            onClick={() => onTransfer(row.record_id)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Move className="h-4 w-4" />
                                                            Transfer
                                                        </DropdownMenuItem>
                                                    )}
                                                    {/* ADD CHECK IN OPTION */}
                                                    {actionState.canCheckIn && onCheckIn && (
                                                        <DropdownMenuItem
                                                            onClick={() => onCheckIn(row.individual_id, row)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Check In
                                                        </DropdownMenuItem>
                                                    )}
                                                    {isSuperAdmin && (
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
                                );
                            })
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