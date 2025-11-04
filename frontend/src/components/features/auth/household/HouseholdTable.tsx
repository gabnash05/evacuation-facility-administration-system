import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Household {
    household_id: number;
    name: string;
    head: string;
    address: string;
    evacCenter?: string;
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
    loading?: boolean;
}

export function HouseholdTable({ data, headers, sortConfig, onSort, onEdit, onDelete, loading }: HouseholdTableProps) {
    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key || !sortConfig.direction) return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        if (sortConfig.direction === "asc") return <ChevronUp className="h-4 w-4" />;
        return <ChevronDown className="h-4 w-4" />;
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {headers.map(header => (
                            <TableHead
                                key={header.key}
                                className={cn(header.sortable && "cursor-pointer hover:bg-muted")}
                                onClick={header.sortable ? () => onSort(header.key) : undefined}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{header.label}</span>
                                    {header.sortable && getSortIcon(header.key)}
                                </div>
                            </TableHead>
                        ))}
                         <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 && !loading ? (
                        <TableRow>
                            <TableCell colSpan={headers.length + 1} className="h-32 text-center">
                                <div className="text-muted-foreground"><div className="text-lg font-medium">No households found</div></div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, index) => (
                            <TableRow key={row.household_id} className={cn(index % 2 === 1 && "bg-muted/30")}>
                                {headers.map(header => (
                                    <TableCell key={header.key} className="py-3">{row[header.key as keyof Household]}</TableCell>
                                ))}
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(row.household_id)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(row.household_id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
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

export default HouseholdTable;