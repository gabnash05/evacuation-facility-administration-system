"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate, formatCapacity } from "@/utils/formatters";
import type { EventDetails } from "@/types/event";

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: EventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, eventData }: EventDetailsModalProps) {
    if (!eventData) return null;

    console.log("Event Details Modal Data:", eventData);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            case "monitoring":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "resolved":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const getOccupancyColor = (percentage: number) => {
        if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
        if (percentage >= 50)
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
    };

    const formattedDateDeclared = formatDate(eventData.date_declared);
    const formattedEndDate =
        eventData.end_date && eventData.end_date !== "NA" ? formatDate(eventData.end_date) : "N/A";

    // Calculate totals from evacuation centers
    const totalCapacity = eventData.evacuation_centers.reduce((sum, center) => sum + center.capacity, 0);
    const currentOccupancy = eventData.evacuation_centers.reduce((sum, center) => sum + center.current_occupancy, 0);
    const usagePercentage = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Event Details</DialogTitle>
                </DialogHeader>

                {/* Event Info Section */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                        <label className="text-xs text-muted-foreground">Event Name</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm">{eventData.event_name}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Event Type</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm">{eventData.event_type}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Status</label>
                        <div
                            className={`rounded-lg px-3 py-2 mt-1 text-center ${getStatusColor(eventData.status)}`}
                        >
                            <p className="text-sm font-medium">{eventData.status}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                        <label className="text-xs text-muted-foreground">Date Declared</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm">{formattedDateDeclared}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">End Date</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm">{formattedEndDate}</p>
                        </div>
                    </div>
                </div>

                {/* Capacity and Occupancy Summary */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                        <label className="text-xs text-muted-foreground">Total Capacity</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm font-medium">
                                {totalCapacity.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Current Occupancy</label>
                        <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
                            <p className="text-sm font-medium">
                                {currentOccupancy.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Usage Percentage</label>
                        <div className={`rounded-lg px-3 py-2 mt-1 text-center ${getOccupancyColor(usagePercentage)}`}>
                            <p className="text-sm font-medium">
                                {usagePercentage}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Evacuation Centers Table */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-3">Evacuation Centers Affected</h3>
                    <div className="border border-border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Center Name</TableHead>
                                    <TableHead className="min-w-[120px]">Address</TableHead>
                                    <TableHead className="min-w-[100px]">Capacity</TableHead>
                                    <TableHead className="min-w-[150px]">
                                        Current Occupancy
                                    </TableHead>
                                    <TableHead className="min-w-[120px]">Occupancy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {eventData.evacuation_centers.map((center, i) => {
                                    const centerUsagePercentage = center.capacity > 0 
                                        ? Math.round((center.current_occupancy / center.capacity) * 100)
                                        : 0;
                                    
                                    return (
                                        <TableRow key={i}>
                                            <TableCell
                                                className="font-medium max-w-[200px] truncate"
                                                title={center.center_name}
                                            >
                                                {center.center_name}
                                            </TableCell>
                                            <TableCell
                                                className="max-w-[120px] truncate"
                                                title={center.address}
                                            >
                                                {center.address}
                                            </TableCell>
                                            <TableCell>{center.capacity.toLocaleString()}</TableCell>
                                            <TableCell>{center.current_occupancy.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-3 py-1 rounded text-xs font-medium inline-block ${getOccupancyColor(centerUsagePercentage)}`}
                                                >
                                                    {formatCapacity(center.current_occupancy, center.capacity)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}