// components/features/transfer/EvacuationCentersList.tsx
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mock data for demonstration
const mockCenters = [
    {
        center_id: 1,
        center_name: "San Lorenzo Parish Church",
        capacity: 500,
        current_occupancy: 100,
    },
    {
        center_id: 2,
        center_name: "Iligan City National High School",
        capacity: 1000,
        current_occupancy: 600,
    },
    {
        center_id: 3,
        center_name: "Iligan City National High School - Annex",
        capacity: 1000,
        current_occupancy: 50,
    },
];

interface EvacuationCentersListProps {
    selectedCenterId: number | null;
    onCenterSelect: (centerId: number | null) => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function EvacuationCentersList({
    selectedCenterId,
    onCenterSelect,
    searchQuery = "",
    onSearchChange,
}: EvacuationCentersListProps) {
    const getCapacityColor = (occupancy: number, capacity: number) => {
        const percentage = (occupancy / capacity) * 100;
        
        if (percentage >= 80) return "bg-red-500";
        if (percentage >= 50) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getCapacityPercentage = (occupancy: number, capacity: number) => {
        return Math.round((occupancy / capacity) * 100);
    };

    // Filter centers based on search query
    const filteredCenters = mockCenters.filter(center => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return center.center_name.toLowerCase().includes(searchLower);
    });

    return (
        <div className="border rounded-lg">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="font-semibold">Center Name</TableHead>
                            <TableHead className="font-semibold text-center">Capacity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCenters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <div className="text-muted-foreground">
                                        {searchQuery ? "No centers found" : "No centers available"}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCenters.map((center, index) => {
                            const percentage = getCapacityPercentage(
                                center.current_occupancy,
                                center.capacity
                            );
                            const isSelected = selectedCenterId === center.center_id;

                            return (
                                <TableRow
                                    key={center.center_id}
                                    className={`${index % 2 === 1 ? "bg-muted/30" : ""} ${isSelected ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => 
                                                onCenterSelect(isSelected ? null : center.center_id)
                                            }
                                            aria-label={`Select ${center.center_name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {center.center_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getCapacityColor(center.current_occupancy, center.capacity)}`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span
                                                className={`text-sm font-medium px-2 py-1 rounded ${
                                                    percentage >= 80
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                                        : percentage >= 50
                                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                                }`}
                                            >
                                                {percentage}%
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}