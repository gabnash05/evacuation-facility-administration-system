"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ChevronsUpDown, MapPin } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { EvacuationCenter } from "@/types/center";
import type { Event } from "@/types/event";
import { eventService } from "@/services/eventService";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import MonoMap from "../map/MonoMap";

interface EvacuationCenterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    center: EvacuationCenter | null;
}

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "NA";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};


// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "N/A";
    
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return "N/A";
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age.toString();
};


// Helper function to capitalize status for display
const capitalizeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        active: "Active",
        monitoring: "Monitoring",
        resolved: "Resolved",
    };
    return statusMap[status.toLowerCase()] || status;
};

export function EvacuationCenterDetailsModal({
    isOpen,
    onClose,
    center,
}: EvacuationCenterDetailsModalProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc" | null;
    } | null>(null);
    const [activeTab, setActiveTab] = useState("details");

    // Get attendance store functions
    const { currentAttendees, fetchCurrentAttendees, setFilters } = useAttendanceStore();

    // FIX: Add back the events data fetching
    useEffect(() => {
        const fetchCenterEvents = async () => {
            if (!center || !isOpen) return;

            setEventsLoading(true);
            setError(null);

            try {
                const response = await eventService.getEventsByCenterId(center.center_id);
                setEvents(response.data);
            } catch (err) {
                console.error("Error fetching center events:", err);
                setError("Failed to load event history");
            } finally {
                setEventsLoading(false);
            }
        };

        fetchCenterEvents();
    }, [center, isOpen]);

    // Fetch current attendees when attendance tab is active
    useEffect(() => {
        const fetchAttendees = async () => {
            if (!center || !isOpen || activeTab !== "attendance") return;

            setAttendanceLoading(true);
            setError(null);

            try {
                setFilters({ centerId: center.center_id });
                await fetchCurrentAttendees({ center_id: center.center_id });
            } catch (err) {
                console.error("Error fetching current attendees:", err);
                setError("Failed to load attendance data");
            } finally {
                setAttendanceLoading(false);
            }
        };

        fetchAttendees();
    }, [center, isOpen, activeTab, fetchCurrentAttendees, setFilters]);

    const handleSort = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            setSortConfig({ key, direction: "asc" });
            return;
        }

        switch (sortConfig.direction) {
            case "asc":
                setSortConfig({ key, direction: "desc" });
                break;
            case "desc":
                setSortConfig({ key, direction: null });
                break;
            case null:
            default:
                setSortConfig({ key, direction: "asc" });
                break;
        }
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        switch (sortConfig.direction) {
            case "asc":
                return <ChevronUp className="h-4 w-4" />;
            case "desc":
                return <ChevronDown className="h-4 w-4" />;
            case null:
            default:
                return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusColor = (status: string) => {
        const displayStatus = capitalizeStatus(status);
        switch (displayStatus) {
            case "Active":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            case "Monitoring":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "Resolved":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const getCenterStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
            case "inactive":
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
            case "closed":
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
            default:
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
        }
    };

    // Sort events based on sortConfig
    const sortedEvents = [...events].sort((a, b) => {
        if (!sortConfig || !sortConfig.direction) return 0;

        const { key, direction } = sortConfig;
        let aValue: any = a[key as keyof Event];
        let bValue: any = b[key as keyof Event];

        // Handle date sorting
        if (key === "date_declared" || key === "end_date") {
            aValue = aValue ? new Date(aValue).getTime() : 0;
            bValue = bValue ? new Date(bValue).getTime() : 0;
        }

        // Handle string sorting
        if (typeof aValue === "string" && typeof bValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    if (!center) return null;

    // Prepare the center for MonoMap display
    const centerForMap = {
        id: center.center_id,
        name: center.center_name,
        position: [center.latitude || 8.230205, center.longitude || 124.249607] as [number, number],
        currentCapacity: center.current_occupancy,
        maxCapacity: center.capacity,
        address: center.address,
        contact: "",
    };

    // Only include the center in the map if it has valid coordinates
    const mapCenters = center.latitude && center.longitude ? [centerForMap] : [];

    // Set map center to the center's location or default
    const mapCenter: [number, number] = center.latitude && center.longitude 
        ? [center.latitude, center.longitude] 
        : [8.230205, 124.249607];

    // Center Details Content
    const centerDetailsContent = (
        <div className="space-y-6 overflow-y-auto">
            {/* Header and Basic Center Details */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Side - Map */}
                <div className="xl:col-span-1 space-y-3">
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="border border-border rounded-lg bg-muted/50 h-80 relative">
                        <MonoMap 
                            centers={mapCenters}
                            center={mapCenter}
                            zoom={center.latitude && center.longitude ? 15 : 13}
                            onCenterClick={() => {}}
                            className="h-full"
                        />
                        {!center.latitude || !center.longitude ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                <div className="text-center p-4">
                                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No location coordinates available
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    {center.latitude && center.longitude && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>Lat: {center.latitude.toFixed(6)}°</span>
                            <span>•</span>
                            <span>Lng: {center.longitude.toFixed(6)}°</span>
                        </div>
                    )}
                </div>

                {/* Right Side - Center Information */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Center Photo at the top of right side */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Photo of Evacuation Center</Label>
                        <div className="border border-border rounded-lg bg-muted/50 h-60 flex items-center justify-center overflow-hidden">
                            {center.photo_data ? (
                                <img
                                    src={`data:image/jpeg;base64,${center.photo_data}`}
                                    alt={center.center_name}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <div className="text-muted-foreground text-center p-4">
                                    <div className="mb-2">
                                        <svg
                                            className="mx-auto h-16 w-16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm">No photo available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status and Usage Percentage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium">
                                Status
                            </Label>
                            <div>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        getCenterStatusColor(center.status),
                                        "text-sm font-medium px-3 py-1.5"
                                    )}
                                >
                                    {center.status.charAt(0).toUpperCase() +
                                        center.status.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Usage Percentage</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 flex-1">
                                    <div
                                        className={cn(
                                            "h-3 rounded-full",
                                            center.capacity > 0
                                                ? Math.round(
                                                    (center.current_occupancy / center.capacity) *
                                                        100
                                                ) >= 80
                                                    ? "bg-red-600"
                                                    : Math.round(
                                                            (center.current_occupancy /
                                                                center.capacity) *
                                                                100
                                                        ) >= 60
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                                : "bg-gray-400"
                                        )}
                                        style={{
                                            width:
                                                center.capacity > 0
                                                    ? `${Math.min(Math.round((center.current_occupancy / center.capacity) * 100), 100)}%`
                                                    : "0%",
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap min-w-[60px]">
                                    {center.capacity > 0
                                        ? `${Math.round((center.current_occupancy / center.capacity) * 100)}%`
                                        : "0%"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="center_name" className="text-sm font-medium">
                                Center Name
                            </Label>
                            <Input
                                id="center_name"
                                value={center.center_name}
                                readOnly
                                className="bg-muted/50 h-11 text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium">
                                Address
                            </Label>
                            <Input
                                id="address"
                                value={center.address}
                                readOnly
                                className="bg-muted/50 h-11 text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="capacity" className="text-sm font-medium">
                                Capacity
                            </Label>
                            <Input
                                id="capacity"
                                value={center.capacity.toLocaleString()}
                                readOnly
                                className="bg-muted/50 h-11 text-base font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="current_occupancy" className="text-sm font-medium">
                                Current Occupancy
                            </Label>
                            <Input
                                id="current_occupancy"
                                value={center.current_occupancy.toLocaleString()}
                                readOnly
                                className="bg-muted/50 h-11 text-base font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Events Content
    const eventsContent = (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Event History</h3>
                <div className="flex items-center gap-4">
                    {eventsLoading && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Loading events...
                        </Badge>
                    )}
                    {!eventsLoading && (
                        <div className="text-sm text-muted-foreground">
                            {events.length} event{events.length !== 1 ? "s" : ""} associated with this center
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead
                                className="cursor-pointer hover:bg-muted font-semibold min-w-[250px]"
                                onClick={() => handleSort("event_name")}
                            >
                                <div className="flex items-center justify-between">
                                    Event Name
                                    {getSortIcon("event_name")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted font-semibold min-w-[180px]"
                                onClick={() => handleSort("event_type")}
                            >
                                <div className="flex items-center justify-between">
                                    Event Type
                                    {getSortIcon("event_type")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted font-semibold min-w-[160px]"
                                onClick={() => handleSort("date_declared")}
                            >
                                <div className="flex items-center justify-between">
                                    Date Declared
                                    {getSortIcon("date_declared")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted font-semibold min-w-[160px]"
                                onClick={() => handleSort("end_date")}
                            >
                                <div className="flex items-center justify-between">
                                    End Date
                                    {getSortIcon("end_date")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted font-semibold min-w-[140px]"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center justify-between">
                                    Status
                                    {getSortIcon("status")}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {eventsLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <div className="text-muted-foreground">
                                            Loading event history...
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedEvents.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div>No events associated with this center.</div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedEvents.map((event, index) => (
                                <TableRow
                                    key={event.event_id}
                                    className={cn(
                                        "hover:bg-muted/50 transition-colors",
                                        index % 2 === 1 ? "bg-muted/50" : ""
                                    )}
                                >
                                    <TableCell className="font-medium min-w-[250px]">
                                        {event.event_name}
                                    </TableCell>
                                    <TableCell className="min-w-[180px]">
                                        {event.event_type}
                                    </TableCell>
                                    <TableCell className="min-w-[160px]">
                                        {formatDateForDisplay(event.date_declared)}
                                    </TableCell>
                                    <TableCell className="min-w-[160px]">
                                        {event.end_date
                                            ? formatDateForDisplay(event.end_date)
                                            : "NA"}
                                    </TableCell>
                                    <TableCell className="min-w-[140px]">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                getStatusColor(event.status),
                                                "truncate max-w-full inline-block text-sm font-medium px-2.5 py-1"
                                            )}
                                        >
                                            {capitalizeStatus(event.status)}
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

    // Attendance Content
    const attendanceContent = (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Attendees</h3>
                <div className="flex items-center gap-4">
                    {attendanceLoading && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Loading attendees...
                        </Badge>
                    )}
                    {!attendanceLoading && (
                        <div className="text-sm text-muted-foreground">
                            {currentAttendees.length} individual{currentAttendees.length !== 1 ? "s" : ""} currently at this center
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold min-w-[120px]">
                                First Name
                            </TableHead>
                            <TableHead className="font-semibold min-w-[120px]">
                                Last Name
                            </TableHead>
                            <TableHead className="font-semibold min-w-[120px]">
                                Household
                            </TableHead>
                            <TableHead className="font-semibold min-w-[100px]">
                                Age
                            </TableHead>
                            <TableHead className="font-semibold min-w-[100px]">
                                Gender
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <div className="text-muted-foreground">
                                            Loading attendance data...
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : currentAttendees.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div>No individuals currently at this center.</div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentAttendees.map((attendee, index) => {
                                // Parse individual_name to get first and last name
                                const individualName = attendee.individual_name || '';
                                const nameParts = individualName.split(' ');
                                const firstName = nameParts[0] || 'N/A';
                                const lastName = nameParts.slice(1).join(' ') || 'N/A';

                                return (
                                    <TableRow
                                        key={attendee.record_id}
                                        className={cn(
                                            "hover:bg-muted/50 transition-colors",
                                            index % 2 === 1 ? "bg-muted/50" : ""
                                        )}
                                    >
                                        <TableCell className="min-w-[120px]">
                                            {firstName}
                                        </TableCell>
                                        <TableCell className="min-w-[120px]">
                                            {lastName}
                                        </TableCell>
                                        <TableCell className="min-w-[120px]">
                                            {attendee.household_name || "N/A"}
                                        </TableCell>
                                        <TableCell className="min-w-[100px]">
                                            {attendee.date_of_birth ? calculateAge(attendee.date_of_birth) : "N/A"}
                                        </TableCell>
                                        <TableCell className="min-w-[100px]">
                                            {attendee.gender || "N/A"}
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-[85vw] min-w-[85vw] h-[90vh] p-0 overflow-hidden flex flex-col"
                onOpenAutoFocus={e => {
                    e.preventDefault();
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <div className="p-6 pb-4 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Evacuation Center Details
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    {/* Fixed Tabs */}
                    <div className="px-6 flex-shrink-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 justify-start">
                                <TabsTrigger value="details">Center Details</TabsTrigger>
                                <TabsTrigger value="events">Events</TabsTrigger>
                                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-hidden px-6 pb-6">
                        <Tabs value={activeTab} className="w-full h-full">
                            <TabsContent value="details" className="h-full m-0 pt-4 overflow-hidden">
                                <div className="h-full overflow-y-auto pr-2 -mr-2">
                                    {centerDetailsContent}
                                </div>
                            </TabsContent>

                            <TabsContent value="events" className="h-full m-0 pt-4 overflow-hidden">
                                <div className="h-full overflow-y-auto pr-2 -mr-2">
                                    {eventsContent}
                                </div>
                            </TabsContent>

                            <TabsContent value="attendance" className="h-full m-0 pt-4 overflow-hidden">
                                <div className="h-full overflow-y-auto pr-2 -mr-2">
                                    {attendanceContent}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}