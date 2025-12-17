// components/features/events/CreateEventModal.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, CalendarIcon, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddCenterModal } from "@/components/features/events/AddCenterModal";
import { eventService } from "@/services/eventService";
import { parseDate } from "@/utils/formatters";
import type { Event } from "@/types/event";
import type { EvacuationCenter } from "@/types/center";
import { useEventStore } from "@/store/eventStore";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (eventData: EventData) => Promise<void>;
    initialData?: Event;
}

interface EventData {
    event_name: string;
    event_type: string;
    status: string;
    date_declared: string;
    end_date: string | null;
    center_ids: number[];
}

// Helper function to transform backend center data to EvacuationCenter type
const transformCenterData = (center: any): EvacuationCenter => ({
    center_id: center.center_id,
    center_name: center.center_name,
    address: center.barangay || center.address || "",
    capacity: center.capacity,
    current_occupancy: center.current_occupancy,
    status: "active",
    created_at: center.created_at || new Date().toISOString(),
    updated_at: center.updated_at,
    latitude: center.latitude || 0,
    longitude: center.longitude || 0,
});

export function CreateEventModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}: CreateEventModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [event_name, setEventName] = useState("");
    const [event_type, setEventType] = useState("");
    const [status, setStatus] = useState<string>("active");
    const [date_declared, setDateDeclared] = useState<Date>();
    const [end_date, setEndDate] = useState<Date | "N/A">("N/A");
    const [evacuation_centers, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
    const [isAddCenterOpen, setIsAddCenterOpen] = useState(false);
    const [customEventType, setCustomEventType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { createEvent, updateEvent, loading: storeLoading } = useEventStore();

    // Check if this is a resolved event (read-only)
    const isResolvedEvent = initialData?.status?.toLowerCase() === 'resolved';

    // Initialize form with initialData when editing
    useEffect(() => {
        const loadEventData = async () => {
            if (initialData && isOpen) {
                setEventName(initialData.event_name);
                setEventType(initialData.event_type);
                setStatus(initialData.status);
                setDateDeclared(await parseDate(initialData.date_declared));
                setEndDate(
                    initialData.end_date === "NA" || !initialData.end_date
                        ? "N/A"
                        : (parseDate(initialData.end_date) ?? "N/A")
                );

                // Fetch existing centers for this event
                try {
                    const centersResponse = await eventService.getEventCenters(
                        initialData.event_id
                    );
                    // Transform the backend data to match EvacuationCenter type
                    const transformedCenters = centersResponse.data.map(transformCenterData);
                    setEvacuationCenters(transformedCenters);
                } catch (error) {
                    console.error("Failed to load event centers:", error);
                    setEvacuationCenters([]);
                }
            } else if (isOpen) {
                handleReset();
            }
        };

        loadEventData();
    }, [initialData, isOpen]);

    const handleAddEvent = async () => {
        setError(null);
        setIsSubmitting(true);

        if (!isFormValid) {
            setError("Please fill in all required fields");
            setIsSubmitting(false);
            return;
        }

        // Format dates as YYYY-MM-DD to avoid timezone issues
        const formatForBackend = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        try {
            const eventData = {
                event_name: event_name,
                event_type: event_type === "other" ? customEventType : event_type,
                status: status.toLowerCase(),
                date_declared: date_declared ? formatForBackend(date_declared) : "",
                end_date: end_date === "N/A" ? null : end_date ? formatForBackend(end_date) : null,
                center_ids: evacuation_centers.map(center => center.center_id),
            };

            // If onSubmit prop is provided (for backward compatibility), use it
            if (onSubmit) {
                await onSubmit(eventData);
                handleClose();
            } else {
                // Otherwise, use the store
                let result;
                if (initialData) {
                    // Prevent updating resolved events
                    if (isResolvedEvent) {
                        throw new Error("Cannot update a resolved event");
                    }
                    
                    result = await updateEvent(initialData.event_id, eventData);
                } else {
                    result = await createEvent(eventData);
                }

                if (result.success) {
                    handleClose();
                } else {
                    setError(result.message || "Failed to save event");
                }
            }
        } catch (err: any) {
            // Handle specific error types
            if (err.message?.includes("already exists")) {
                setError(`An event with the name "${event_name}" already exists.`);
            } else if (err.message?.includes("Validation error")) {
                setError(err.message);
            } else {
                setError(err.message || "Failed to save event. Please try again.");
            }
            console.error("Create/update event error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setEventName("");
        setEventType("");
        setStatus("active");
        setDateDeclared(undefined);
        setEndDate("N/A");
        setEvacuationCenters([]);
        setCustomEventType("");
        setError(null);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleRemoveCenter = (index: number) => {
        setEvacuationCenters(evacuation_centers.filter((_, i) => i !== index));
    };

    const handleAddCenters = (centers: EvacuationCenter[]) => {
        // Avoid duplicates
        const existingIds = new Set(evacuation_centers.map(c => c.center_id));
        const filtered = centers.filter(c => !existingIds.has(c.center_id));
        setEvacuationCenters([...evacuation_centers, ...filtered]);
    };

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

    const getOccupancyColor = (occupancy: string) => {
        const percentage = parseInt(occupancy);
        if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
        if (percentage >= 50)
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
    };

    const getDisplayStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
            active: "Active",
            monitoring: "Monitoring",
            resolved: "Resolved",
        };
        return statusMap[status.toLowerCase()] || status;
    };

    const isFormValid = event_name && event_type && date_declared;
    const isLoading = isSubmitting || storeLoading;
    const isReadOnly = isResolvedEvent;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            {initialData ? (isResolvedEvent ? "View Resolved Event" : "Edit Event") : "Create Event"}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Warning for resolved event */}
                    {isResolvedEvent && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">
                                    This event is resolved and cannot be modified. Use the "Resolve Event" action to manage event resolution.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Event Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Event Name</label>
                            <Input
                                value={event_name}
                                onChange={e => setEventName(e.target.value)}
                                placeholder="Enter event name"
                                className="w-full"
                                disabled={isLoading || isReadOnly}
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Event Type</label>
                            <Select 
                                value={event_type} 
                                onValueChange={setEventType} 
                                disabled={isLoading || isReadOnly}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select disaster type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Typhoon">Typhoon</SelectItem>
                                    <SelectItem value="Flood">Flood</SelectItem>
                                    <SelectItem value="Earthquake">Earthquake</SelectItem>
                                    <SelectItem value="Fire">Fire</SelectItem>
                                    <SelectItem value="Landslide">Landslide</SelectItem>
                                    <SelectItem value="Storm Surge">Storm Surge</SelectItem>
                                    <SelectItem value="Volcanic Eruption">
                                        Volcanic Eruption
                                    </SelectItem>
                                    <SelectItem value="Tsunami">Tsunami</SelectItem>
                                    <SelectItem value="Pandemic">Pandemic</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            {event_type === "other" && (
                                <Input
                                    value={customEventType}
                                    onChange={e => setCustomEventType(e.target.value)}
                                    placeholder="Specify disaster type"
                                    className="mt-2"
                                    disabled={isLoading || isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select 
                                value={status} 
                                onValueChange={setStatus} 
                                disabled={isLoading || !initialData || isReadOnly}
                            >
                                <SelectTrigger className={`w-full ${getStatusColor(status)}`}>
                                    <SelectValue>{getDisplayStatus(status)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="monitoring">Monitoring</SelectItem>
                                    <SelectItem value="resolved" disabled>
                                        Resolved (Use Resolve Action)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {!initialData && (
                                <p className="text-xs text-muted-foreground">
                                    New events are always created as "Active"
                                </p>
                            )}
                            {initialData && status === 'resolved' && !isReadOnly && (
                                <p className="text-xs text-yellow-600">
                                    To resolve an event, use the "Resolve Event" action in the table
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Declared</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date_declared && "text-muted-foreground"
                                        )}
                                        disabled={isLoading || isReadOnly}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date_declared
                                            ? format(date_declared, "dd/MM/yyyy")
                                            : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date_declared}
                                        onSelect={setDateDeclared}
                                        disabled={date => date > new Date() || isReadOnly}
                                        captionLayout="dropdown-years"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            end_date === "N/A" && "text-muted-foreground"
                                        )}
                                        disabled={isLoading || isReadOnly}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {end_date === "N/A"
                                            ? "N/A"
                                            : end_date
                                              ? format(end_date, "dd/MM/yyyy")
                                              : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="p-3 border-b">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setEndDate("N/A")}
                                            disabled={isLoading || isReadOnly}
                                        >
                                            Set as N/A
                                        </Button>
                                    </div>
                                    <Calendar
                                        mode="single"
                                        selected={end_date === "N/A" ? undefined : end_date}
                                        onSelect={date => setEndDate(date || "N/A")}
                                        disabled={date => date > new Date() || isReadOnly}
                                        captionLayout="dropdown-years"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Evacuation Centers Section */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm">Evacuation Centers Affected</h3>
                            {!isReadOnly && (
                                <Button
                                    onClick={() => setIsAddCenterOpen(true)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    disabled={isLoading}
                                >
                                    <Plus className="h-4 w-4" />
                                    {initialData ? "Update Centers" : "Add Center"}
                                </Button>
                            )}
                        </div>

                        {/* Responsive table container */}
                        <div className="border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table className="min-w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">
                                                Center Name
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                Address
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                Capacity
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                Current Occupancy
                                            </TableHead>
                                            <TableHead className="whitespace-nowrap">
                                                Occupancy
                                            </TableHead>
                                            {!isReadOnly && (
                                                <TableHead className="whitespace-nowrap">
                                                    Action
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {evacuation_centers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={isReadOnly ? 5 : 6}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    No evacuation centers added yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            evacuation_centers.map((center, i) => (
                                                <TableRow key={i}>
                                                    <TableCell
                                                        className="max-w-[120px] truncate"
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
                                                    <TableCell>{center.capacity}</TableCell>
                                                    <TableCell>
                                                        {center.current_occupancy}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium inline-block ${getOccupancyColor(`${Math.round((center.current_occupancy / center.capacity) * 100)}%` || "0%")}`}
                                                        >
                                                            {`${Math.round((center.current_occupancy / center.capacity) * 100)}%`}
                                                        </span>
                                                    </TableCell>
                                                    {!isReadOnly && (
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveCenter(i)}
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                disabled={isLoading}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Button */}
                    <div className="flex justify-end pt-4 border-t gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium"
                        >
                            {isReadOnly ? "Close" : "Cancel"}
                        </Button>
                        {!isReadOnly && (
                            <Button
                                onClick={handleAddEvent}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium"
                                disabled={!isFormValid || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {initialData ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        {initialData ? "Update Event" : "Add Event"}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Center Modal */}
            {!isReadOnly && (
                <AddCenterModal
                    isOpen={isAddCenterOpen}
                    onClose={() => setIsAddCenterOpen(false)}
                    onAddCenters={handleAddCenters}
                    existingCenters={evacuation_centers}
                />
            )}
        </>
    );
}