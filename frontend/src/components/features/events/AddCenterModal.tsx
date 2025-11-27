// components/features/events/AddCenterModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, CirclePlus, CircleMinus } from "lucide-react";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import type { EvacuationCenter } from "@/types/center";

interface AddCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCenters: (centers: EvacuationCenter[]) => void;
    existingCenters?: EvacuationCenter[]; // Add this prop
}

export function AddCenterModal({
    isOpen,
    onClose,
    onAddCenters,
    existingCenters = [], // Default to empty array
}: AddCenterModalProps) {
    const [selectedCenterIds, setSelectedCenterIds] = useState<Set<number>>(new Set());

    const {
        centers: availableCenters,
        loading: isLoading,
        error,
        fetchAllCenters,
    } = useEvacuationCenterStore();

    useEffect(() => {
        if (isOpen) {
            fetchAllCenters();
            setSelectedCenterIds(new Set()); // Reset selection when modal opens
        }
    }, [isOpen, fetchAllCenters]);

    // Filter out centers that are already added to the event
    const filteredCenters = availableCenters.filter(
        center => !existingCenters.some(existing => existing.center_id === center.center_id)
    );

    const handleToggleCenter = (centerId: number) => {
        setSelectedCenterIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(centerId)) {
                newSet.delete(centerId);
            } else {
                newSet.add(centerId);
            }
            return newSet;
        });
    };

    const handleAddCenters = () => {
        const selectedCenters = filteredCenters.filter(center =>
            selectedCenterIds.has(center.center_id)
        );
        onAddCenters(selectedCenters);
        setSelectedCenterIds(new Set());
        onClose();
    };

    const handleClose = () => {
        setSelectedCenterIds(new Set());
        onClose();
    };

    const getOccupancyColor = (center: EvacuationCenter) => {
        const percentage =
            center.capacity > 0
                ? Math.round((center.current_occupancy / center.capacity) * 100)
                : 0;

        if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
        if (percentage >= 50)
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            case "inactive":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "closed":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const getDisplayStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
            active: "Active",
            inactive: "Inactive",
            closed: "Closed",
        };
        return statusMap[status.toLowerCase()] || status;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add Center</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mt-4">
                        {error}
                    </div>
                )}

                {/* Info about excluded centers */}
                {existingCenters.length > 0 && (
                    <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded-md mt-4">
                        <p className="text-sm">
                            {existingCenters.length} center{existingCenters.length !== 1 ? "s" : ""}{" "}
                            already added to this event are hidden
                        </p>
                    </div>
                )}

                <div className="mt-4 border border-border rounded-lg overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            <p className="text-lg">Loading evacuation centers...</p>
                        </div>
                    ) : filteredCenters.length === 0 ? (
                        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            <p className="text-lg">
                                {availableCenters.length === 0
                                    ? "No evacuation centers available"
                                    : "All available centers are already added to this event"}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Center Name</TableHead>
                                    <TableHead className="min-w-[200px]">Address</TableHead>
                                    <TableHead className="min-w-[100px]">Status</TableHead>
                                    <TableHead className="min-w-[100px]">Capacity</TableHead>
                                    <TableHead className="min-w-[150px]">
                                        Current Occupancy
                                    </TableHead>
                                    <TableHead className="min-w-[120px]">Occupancy</TableHead>
                                    <TableHead className="min-w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCenters.map((center, i) => {
                                    const isSelected = selectedCenterIds.has(center.center_id);
                                    const occupancyPercentage =
                                        center.capacity > 0
                                            ? Math.round(
                                                  (center.current_occupancy / center.capacity) * 100
                                              )
                                            : 0;

                                    return (
                                        <TableRow
                                            key={center.center_id}
                                            className={`${i % 2 === 1 ? "bg-muted" : ""} ${isSelected ? "bg-green-50 dark:bg-green-950" : ""}`}
                                        >
                                            <TableCell className="font-medium">
                                                {center.center_name}
                                            </TableCell>
                                            <TableCell>{center.address}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-3 py-1 rounded text-xs font-medium inline-block ${getStatusColor(center.status)}`}
                                                >
                                                    {getDisplayStatus(center.status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{center.capacity}</TableCell>
                                            <TableCell>{center.current_occupancy}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-3 py-1 rounded text-xs font-medium inline-block ${getOccupancyColor(center)}`}
                                                >
                                                    {`${occupancyPercentage}%`}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleToggleCenter(center.center_id)
                                                    }
                                                    className="h-8 w-8"
                                                >
                                                    {isSelected ? (
                                                        <CircleMinus className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <CirclePlus className="h-4 w-4 text-green-600" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                        <p>
                            {selectedCenterIds.size} center{selectedCenterIds.size !== 1 ? "s" : ""}{" "}
                            selected
                        </p>
                        {existingCenters.length > 0 && (
                            <p>
                                {filteredCenters.length} of {availableCenters.length} centers
                                available
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleAddCenters}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        disabled={selectedCenterIds.size === 0 || isLoading}
                    >
                        <Plus className="h-4 w-4" />
                        Add Centers ({selectedCenterIds.size})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
