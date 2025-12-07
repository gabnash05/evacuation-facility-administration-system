import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type{ DistributionRecord } from "@/types/distribution";
import { Badge } from "@/components/ui/badge";

interface Props {
    data: DistributionRecord[];
    loading?: boolean;
}

export function DistributionHistoryTable({ data, loading }: Props) {
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
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
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}