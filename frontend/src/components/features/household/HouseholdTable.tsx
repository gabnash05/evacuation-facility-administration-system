import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical, Edit, Trash2 } from "lucide-react";
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
import { DeleteHouseholdDialog } from "./DeleteHouseholdDialog";
import { cn } from "@/lib/utils";

export interface Household {
    household_id: number;
    householdName: string;
    householdHead: string;
    address: string;
    center?: string;
}

export type SortConfig = {
    key: string;
    direction: "asc" | "desc" | null;
} | null;

interface HouseholdTableProps {
    data: Household[];
    headers: { key: string; label: string; sortable: boolean }[];
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onRowClick: (id: number) => void;
    loading?: boolean;
    userRole?: string;
}

export function HouseholdTable({
    data,
    headers,
    sortConfig,
    onSort,
    onEdit,
    onDelete,
    onRowClick,
    loading,
    userRole,
}: HouseholdTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [householdToDelete, setHouseholdToDelete] = useState<{ id: number; name: string } | null>(
        null
    );

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || !sortConfig.direction)
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        if (sortConfig.direction === "asc") return <ChevronUp className="h-4 w-4" />;
        return <ChevronDown className="h-4 w-4" />;
    };

    const handleDeleteClick = (household: Household) => {
        setHouseholdToDelete({
            id: household.household_id,
            name: household.householdName,
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (householdToDelete) {
            await onDelete(householdToDelete.id);
            setDeleteDialogOpen(false);
            setHouseholdToDelete(null);
        }
    };

    const handleCloseDialog = () => {
        setDeleteDialogOpen(false);
        setHouseholdToDelete(null);
    };

    // Check if user can delete (only super_admin)
    const canDelete =
        userRole === "super_admin" || userRole === "city_admin" || userRole === "center_admin";

    const handleDropdownClick = (e: React.MouseEvent, householdId: number) => {
        e.stopPropagation();
        onRowClick(householdId);
    };

    if (data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-muted-foreground">No households found.</div>
            </div>
        );
    }

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
                                        Loading households...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow
                                    key={row.household_id}
                                    className={cn(
                                        "hover:bg-muted/50 cursor-pointer", // Added cursor-pointer
                                        index % 2 === 1 && "bg-muted/30"
                                    )}
                                    onClick={() => onRowClick(row.household_id)} // Added row click handler
                                >
                                    {headers.map(header => (
                                        <TableCell key={header.key} className="py-3">
                                            {row[header.key as keyof Household]}
                                        </TableCell>
                                    ))}
                                    <TableCell 
                                        className="text-right"
                                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => e.stopPropagation()} // Prevent row click
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => onEdit(row.household_id)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {canDelete && (
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
            <DeleteHouseholdDialog
                isOpen={deleteDialogOpen}
                onClose={handleCloseDialog}
                onConfirm={handleConfirmDelete}
                householdName={householdToDelete?.name || ""}
                loading={loading}
            />
        </>
    );
}

export default HouseholdTable;