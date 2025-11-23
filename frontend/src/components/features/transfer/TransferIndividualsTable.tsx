import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Individual {
    individual_id: number;
    name: string;
    household: string;
    currentCenter: string;
    status: string;
}

interface TransferIndividualsTableProps {
    individuals: Individual[];
    selectedIds: number[];
    onSelectIndividual: (id: number) => void;
    onSelectAll: (checked: boolean) => void;
}

export function TransferIndividualsTable({
    individuals,
    selectedIds,
    onSelectIndividual,
    onSelectAll,
}: TransferIndividualsTableProps) {
    const allSelected = individuals.length > 0 && selectedIds.length === individuals.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < individuals.length;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "sick":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "injured":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
            case "at_risk":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            sick: "Sick",
            injured: "Injured",
            "at_risk": "At Risk",
        };
        return labels[status.toLowerCase()] || status;
    };

    return (
        <div className="border rounded-lg">
            {/* Table Header */}
            <div className="bg-card border-b p-4">
                <h3 className="font-semibold text-base">Individuals</h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={onSelectAll}
                                    aria-label="Select all"
                                    className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                                />
                            </TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Household</TableHead>
                            <TableHead className="font-semibold">Current Center</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {individuals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="text-muted-foreground">No individuals found</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            individuals.map((individual, index) => (
                                <TableRow
                                    key={individual.individual_id}
                                    className={index % 2 === 1 ? "bg-muted/30" : ""}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(individual.individual_id)}
                                            onCheckedChange={() =>
                                                onSelectIndividual(individual.individual_id)
                                            }
                                            aria-label={`Select ${individual.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {individual.name}
                                    </TableCell>
                                    <TableCell>{individual.household}</TableCell>
                                    <TableCell>{individual.currentCenter}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={getStatusColor(individual.status)}
                                        >
                                            {getStatusLabel(individual.status)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}