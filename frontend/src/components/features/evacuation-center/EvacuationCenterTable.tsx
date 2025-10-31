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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";
import type { EvacuationCenter } from "@/types/center";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";

interface EvacuationCenterTableProps {
    data: EvacuationCenter[];
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    onSort: (key: string) => void;
    loading?: boolean;
}

export function EvacuationCenterTable({ data, sortConfig, onSort, loading }: EvacuationCenterTableProps) {
    const { deleteCenter } = useEvacuationCenterStore();

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
        { key: "center_name", label: "Center Name", sortable: true, width: columnWidths.center_name },
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
            case "closed":
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
            default:
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this evacuation center?")) {
            try {
                await deleteCenter(id);
            } catch (error) {
                console.error("Failed to delete center:", error);
            }
        }
    };

    return (
        <div className="w-full">
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
                            
                            return (
                                <TableRow
                                    key={center.center_id}
                                    className={cn(
                                        "cursor-pointer hover:bg-muted/50 transition-colors",
                                        index % 2 === 1 ? "bg-muted/30" : ""
                                    )}
                                >
                                    <TableCell
                                        className="font-medium py-3 truncate align-top text-left"
                                        style={{ width: columnWidths.center_name }}
                                        title={center.center_name}
                                    >
                                        {center.center_name}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 truncate align-top text-left"
                                        style={{ width: columnWidths.address }}
                                        title={center.address}
                                    >
                                        {center.address}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-top text-left"
                                        style={{ width: columnWidths.capacity }}
                                    >
                                        {center.capacity.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-top text-left"
                                        style={{ width: columnWidths.current_occupancy }}
                                    >
                                        {center.current_occupancy.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-top text-left"
                                        style={{ width: columnWidths.usage }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-secondary rounded-full h-2 flex-shrink-0">
                                                <div
                                                    className={cn(
                                                        "h-2 rounded-full",
                                                        usagePercentage >= 80
                                                            ? "bg-red-500"
                                                            : usagePercentage >= 60
                                                              ? "bg-yellow-500"
                                                              : "bg-green-500"
                                                    )}
                                                    style={{ width: `${usagePercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium whitespace-nowrap">
                                                {usagePercentage}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-top text-left"
                                        style={{ width: columnWidths.status }}
                                    >
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                getStatusStyles(center.status),
                                                "truncate max-w-full inline-block"
                                            )}
                                        >
                                            {center.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="py-3 align-top text-left"
                                        style={{ width: columnWidths.actions }}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => console.log(`Edit ${center.center_id}`)}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(center.center_id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
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
    );
}