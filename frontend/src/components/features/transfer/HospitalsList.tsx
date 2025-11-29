// components/features/transfer/HospitalsList.tsx
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
const mockHospitals = [
    {
        hospital_id: 1,
        hospital_name: "Iligan Medical Center",
        address: "Quezon Ave, Iligan City",
    },
    {
        hospital_id: 2,
        hospital_name: "Mindanao Sanitarium Hospital",
        address: "Tibanga, Iligan City",
    },
    {
        hospital_id: 3,
        hospital_name: "ACE Medical Center",
        address: "Pala-o, Iligan City",
    },
    {
        hospital_id: 4,
        hospital_name: "Iligan Doctors Hospital",
        address: "Buhanginan, Iligan City",
    },
];

interface HospitalsListProps {
    selectedHospitalId: number | null;
    onHospitalSelect: (hospitalId: number | null) => void;
}

export function HospitalsList({ selectedHospitalId, onHospitalSelect }: HospitalsListProps) {

    return (
        <div className="border rounded-lg">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="font-semibold">Hospital Name</TableHead>
                            <TableHead className="font-semibold">Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockHospitals.map((hospital, index) => {
                            const isSelected = selectedHospitalId === hospital.hospital_id;

                            return (
                                <TableRow
                                    key={hospital.hospital_id}
                                    className={`${index % 2 === 1 ? "bg-muted/30" : ""} ${
                                        isSelected ? "bg-blue-50 dark:bg-blue-950" : ""
                                    }`}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() =>
                                                onHospitalSelect(
                                                    isSelected ? null : hospital.hospital_id
                                                )
                                            }
                                            aria-label={`Select ${hospital.hospital_name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {hospital.hospital_name}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {hospital.address}
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