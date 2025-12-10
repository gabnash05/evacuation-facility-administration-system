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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type{ DistributionRecord } from "@/types/distribution";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

interface Props {
    data: DistributionRecord[];
    loading?: boolean;
    userRole?: string; // NEW prop
    onEdit?: (record: DistributionRecord) => void;
    onDelete?: (record: DistributionRecord) => void;
}

export function DistributionHistoryTable({ data, loading, userRole, onEdit, onDelete }: Props) {
    const isSuperAdmin = userRole === "super_admin";

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading records...</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Time Distributed</TableHead>
                        <TableHead>Household Name</TableHead>
                        <TableHead>Aid Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Volunteer</TableHead>
                        {isSuperAdmin && <TableHead className="w-[80px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={isSuperAdmin ? 6 : 5} className="h-32 text-center text-muted-foreground">
                                No distribution records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record) => (
                            <TableRow key={record.distribution_id} className="hover:bg-muted/30">
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(record.distribution_date), "MMM d, yyyy h:mm a")}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {record.household_name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {record.resource_name}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-bold pl-6">
                                    {record.quantity}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {record.volunteer_name}
                                </TableCell>
                                
                                {/* Action Column for Super Admin */}
                                {isSuperAdmin && (
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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