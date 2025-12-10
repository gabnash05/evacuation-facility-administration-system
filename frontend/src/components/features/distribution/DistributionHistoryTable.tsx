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
    data: DistributionRecord[];
    loading?: boolean;
    userRole?: string;
    onEdit?: (record: DistributionRecord) => void;
    onDelete?: (record: DistributionRecord) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
}

export function DistributionHistoryTable({ 
    data, 
    loading, 
    userRole, 
    onEdit, 
    onDelete,
    onSort,
    sortColumn,
    sortDirection 
}: Props) {
    const isSuperAdmin = userRole === "super_admin";
    
    // According to requirements: "Void Record" is for ALL USERS
    // Use store action
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
        { key: "status", label: "Status", sortable: true }, // NEW COLUMN
        { key: "volunteer_name", label: "Distributed By", sortable: true },
    ];

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading records...</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {columns.map((column) => (
                            <TableHead key={column.key}>
                                {column.sortable && onSort ? (
                                    <Button
                                        variant="ghost"
                                        onClick={() => onSort(column.key)}
                                        className="h-auto w-full justify-start p-0 font-semibold hover:bg-transparent"
                                    >
                                        <span className="flex items-center">
                                            {column.label}
                                            {getSortIcon(column.key)}
                                        </span>
                                    </Button>
                                ) : (
                                    column.label
                                )}
                            </TableHead>
                        ))}
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                No distribution records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record, index) => (
                            <TableRow 
                                key={record.distribution_id} 
                                className={`
                                    ${index % 2 === 1 ? "bg-muted/50" : ""}
                                    ${record.status === 'voided' ? "opacity-60 grayscale bg-muted/20" : "hover:bg-muted/30"}
                                `}
                            >
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(record.distribution_date), "MMM d, yyyy h:mm a")}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {record.household_name}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {record.category_name}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {record.resource_name}
                                </TableCell>
                                <TableCell className="font-bold pl-6">
                                    {record.quantity}
                                </TableCell>
                                
                                {/* NEW STATUS CELL */}
                                <TableCell>
                                    <Badge variant={record.status === 'completed' ? "outline" : "destructive"}>
                                        {record.status === 'completed' ? 'Complete' : 'Voided'}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-sm">
                                    {record.volunteer_name}
                                </TableCell>
                                
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {/* Edit/Delete for Super Admin (Only if not voided) */}
                                            {isSuperAdmin && record.status !== 'voided' && (
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

                                            {/* Void/Restore Action (All Users) */}
                                            <DropdownMenuItem onClick={() => toggleStatus(record.distribution_id)}>
                                                {record.status === 'completed' ? (
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
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}