// components/features/transfer/HouseholdsList.tsx
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mock data for demonstration - Replace with actual API call
const mockHouseholds = [
    {
        household_id: 1,
        household_name: "Flores Household",
        address: "123 Main St, Iligan City",
    },
    {
        household_id: 2,
        household_name: "Cruz Household",
        address: "456 Oak Ave, Iligan City",
    },
    {
        household_id: 3,
        household_name: "Santos Household",
        address: "789 Pine Rd, Iligan City",
    },
    {
        household_id: 4,
        household_name: "Reyes Household",
        address: "321 Elm St, Iligan City",
    },
];

interface HouseholdsListProps {
    selectedHouseholdId: number | null;
    onHouseholdSelect: (householdId: number | null) => void;
}

export function HouseholdsList({
    selectedHouseholdId,
    onHouseholdSelect,
}: HouseholdsListProps) {
    return (
        <div className="border rounded-lg">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="font-semibold">Household Name</TableHead>
                            <TableHead className="font-semibold">Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockHouseholds.map((household, index) => {
                            const isSelected = selectedHouseholdId === household.household_id;

                            return (
                                <TableRow
                                    key={household.household_id}
                                    className={`${index % 2 === 1 ? "bg-muted/30" : ""} ${
                                        isSelected ? "bg-blue-50 dark:bg-blue-950" : ""
                                    }`}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() =>
                                                onHouseholdSelect(
                                                    isSelected ? null : household.household_id
                                                )
                                            }
                                            aria-label={`Select ${household.household_name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {household.household_name}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {household.address}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}