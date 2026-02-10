import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { DistributionRecord } from "@/types/distribution";
import { Badge } from "@/components/ui/badge";
import { 
    MoreVertical, 
    Edit2, 
    Trash2, 
    ChevronsUpDown, 
    ChevronUp, 
    ChevronDown, 
    Ban, 
    RotateCcw 
} from "lucide-react";
import { useDistributionStore } from "@/store/distributionStore";

interface Props {
    title?: string;
    data: DistributionRecord[];
    loading?: boolean;
    userRole?: string;
    onEdit?: (record: DistributionRecord) => void;
    onDelete?: (record: DistributionRecord) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    showTitle?: boolean;
    showActions?: boolean;
}

export function DistributionHistoryTable({ 
    title,
    data, 
    loading, 
    userRole, 
    onEdit, 
    onDelete,
    onSort,
    sortColumn,
    sortDirection,
    showTitle = true,
    showActions = true,
}: Props) {
    const isSuperAdmin = userRole === "super_admin";
    const { toggleStatus } = useDistributionStore();

    const getSortIcon = (columnKey: string) => {
        if (!onSort) return null;

        if (sortColumn !== columnKey) {
            return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
        }

        return sortDirection === "desc" ? (
            <ChevronDown className="h-4 w-4 ml-1" />
        ) : (
            <ChevronUp className="h-4 w-4 ml-1" />
        );
    };

    const columns = [
        { key: "distribution_date", label: "Time Distributed", sortable: true },
        { key: "household_name", label: "Household Name", sortable: true },
        { key: "category_name", label: "Category", sortable: true },
        { key: "resource_name", label: "Aid Type", sortable: true },
        { key: "quantity", label: "Quantity", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "volunteer_name", label: "Distributed By", sortable: true },
    ];

    // REMOVE the early return for loading - this is what causes the jump
    // if (loading) {
    //     return (
    //         <div className="border border-border border-t-0">
    //             <div className="p-8 text-center text-muted-foreground">
    //                 Loading records...
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="border border-border border-t-0">
            {showTitle && title && (
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-base text-foreground">
                        {title}
                    </h3>
                </div>
            )}

            <Table className="table-fixed w-full">
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead
                                key={column.key}
                                className={`${column.sortable && onSort ? "p-0" : ""}`}
                            >
                                {column.sortable && onSort ? (
                                    <Button
                                        variant="ghost"
                                        onClick={() => onSort(column.key)}
                                        className="h-full w-full justify-start p-3 hover:bg-transparent font-semibold break-words whitespace-normal"
                                    >
                                        <span className="flex items-center gap-1">
                                            {column.label}
                                            {getSortIcon(column.key)}
                                        </span>
                                    </Button>
                                ) : (
                                    <div className="px-3 py-3 font-semibold">
                                        {column.label}
                                    </div>
                                )}
                            </TableHead>
                        ))}

                        {showActions && (
                            <TableHead className="text-right px-4 py-3">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading && data.length === 0 ? (
                        // SHOW LOADING INSIDE TABLE - LIKE HOUSEHOLDTABLE
                        <TableRow>
                            <TableCell 
                                colSpan={columns.length + (showActions ? 1 : 0)} 
                                className="h-32 text-center"
                            >
                                <div className="text-muted-foreground">
                                    Loading distribution records...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell 
                                colSpan={columns.length + (showActions ? 1 : 0)} 
                                className="text-center py-8 text-muted-foreground"
                            >
                                No distribution records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record, index) => (
                            <TableRow 
                                key={record.distribution_id}
                                className={`
                                    ${index % 2 === 1 ? "bg-muted/50" : ""}
                                    ${record.status === "voided" 
                                        ? "opacity-60 grayscale bg-muted/20" 
                                        : "hover:bg-muted/50 transition-colors"}
                                `}
                            >
                                <TableCell className="text-sm text-muted-foreground break-words whitespace-normal">
                                    {format(new Date(record.distribution_date), "MMM d, yyyy h:mm a")}
                                </TableCell>

                                <TableCell className="font-medium break-words whitespace-normal">
                                    {record.household_name}
                                </TableCell>

                                <TableCell className="font-medium break-words whitespace-normal">
                                    {record.category_name}
                                </TableCell>

                                <TableCell className="font-medium break-words whitespace-normal">
                                    {record.resource_name}
                                </TableCell>

                                <TableCell className="font-bold pl-6 break-words whitespace-normal">
                                    {record.quantity}
                                </TableCell>

                                <TableCell>
                                    <Badge variant={record.status === "completed" ? "outline" : "destructive"}>
                                        {record.status === "completed" ? "Complete" : "Voided"}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-sm break-words whitespace-normal">
                                    {record.volunteer_name}
                                </TableCell>

                                {showActions && (
                                    <TableCell 
                                        className="text-right px-4 break-words whitespace-normal"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                {/* Super Admin Actions */}
                                                {isSuperAdmin && record.status !== "voided" && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onEdit?.(record)}>
                                                            <Edit2 className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem 
                                                            onClick={() => onDelete?.(record)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}

                                                {/* Void / Restore — All Users */}
                                                <DropdownMenuItem onClick={() => toggleStatus(record.distribution_id)}>
                                                    {record.status === "completed" ? (
                                                        <>
                                                            <Ban className="h-4 w-4 mr-2 text-orange-500" /> 
                                                            Void Record
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="h-4 w-4 mr-2 text-green-600" /> 
                                                            Restore Record
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
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
    );
}