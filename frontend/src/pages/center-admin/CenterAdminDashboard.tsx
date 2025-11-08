"use client";

import { useState, useMemo, useEffect } from "react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { MapPanel } from "@/components/features/dashboard/MapPanel";
import { StatsRow } from "@/components/features/dashboard/StatsRow";
import { EventHistoryTable } from "@/components/features/dashboard/EventHistoryTable";
import { ErrorAlert } from "@/components/features/dashboard/ErrorAlert";
import { eventService } from "@/services/eventService";

interface Event {
    eventName: string;
    eventType: string;
    dateDeclared: string;
    endDate: string;
    status: "Active" | "Monitoring" | "Resolved";
    eventId?: number;
}

interface EvacuationCenter {
    centerName: string;
    barangay: string;
    capacity: number;
    currentOccupancy: number;
    occupancy: string;
}

interface EventDetails {
    eventTitle: string;
    eventType: string;
    status: string;
    dateDeclared: string;
    endDate: string;
    evacuationCenters: EvacuationCenter[];
}

interface Stats {
    label: string;
    value: string;
    max: string;
    percentage: number;
}

interface SelectedCenter {
    name: string;
    barangay: string;
    status: "Active" | "Recovery" | "Closed";
    capacity: number;
    currentOccupancy: number;
}

export function CenterAdminDashboard() {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [isLoadingCenter, setIsLoadingCenter] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventHistoryData, setEventHistoryData] = useState<Event[]>([]);
    const [selectedCenter, setSelectedCenter] = useState<SelectedCenter>({
        name: "Bagong Silang Barangay Gym/Hall",
        barangay: "Hinaplanon",
        status: "Active",
        capacity: 500,
        currentOccupancy: 300,
    });
    const [entriesPerPage, setEntriesPerPage] = useState(5);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setIsLoadingEvents(true);
            setError(null);

            const data = await eventService.getAllEvents();

            const transformedEvents: Event[] = data.map(event => ({
                eventId: event.event_id,
                eventName: event.event_name,
                eventType: event.event_type,
                dateDeclared: formatDate(event.date_declared),
                endDate: event.end_date ? formatDate(event.end_date) : "NA",
                status: capitalizeStatus(event.status),
            }));

            setEventHistoryData(transformedEvents);
        } catch (err) {
            setError("Failed to load events. Please try again.");
            console.error("Fetch events error:", err);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const formatDate = (dateString: string): string => {
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

    const capitalizeStatus = (status: string): "Active" | "Monitoring" | "Resolved" => {
        const statusMap: Record<string, "Active" | "Monitoring" | "Resolved"> = {
            active: "Active",
            monitoring: "Monitoring",
            resolved: "Resolved",
        };
        return statusMap[status.toLowerCase()] || "Active";
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
            case "Monitoring":
                return "bg-yellow-100 text-yellow-800 border-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-900";
            case "Resolved":
                return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
            default:
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
        }
    };

    const getCenterStatusStyles = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
            case "Recovery":
                return "bg-orange-100 text-orange-700 border-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-900";
            case "Closed":
                return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
            default:
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-900";
        }
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 80) return "bg-red-500";
        if (percentage >= 60) return "bg-orange-500";
        if (percentage >= 40) return "bg-yellow-500";
        if (percentage >= 20) return "bg-lime-500";
        return "bg-green-500";
    };

    const handleRowClick = async (row: Event) => {
        if (!row.eventId) return;

        try {
            setIsLoadingEvents(true);
            setError(null);

            const apiResponse = await eventService.getEventDetails(row.eventId);

            const eventDetails: EventDetails = {
                eventTitle: apiResponse.event_name,
                eventType: apiResponse.event_type,
                status: capitalizeStatus(apiResponse.status),
                dateDeclared: row.dateDeclared,
                endDate: row.endDate,
                evacuationCenters: apiResponse.centers.map(center => ({
                    centerName: center.center_name,
                    barangay: center.barangay,
                    capacity: center.capacity,
                    currentOccupancy: center.current_occupancy,
                    occupancy: center.occupancy,
                })),
            };

            setSelectedEvent(eventDetails);
            setIsModalOpen(true);
        } catch (err) {
            setError("Failed to load event details. Please try again.");
            console.error("Event details error:", err);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const handleSort = (column: string): void => {
        if (sortColumn === column) {
            // Cycle through: asc -> desc -> null (unsorted)
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortColumn("");
                setSortDirection("asc");
            }
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleStatusChange = (newStatus: string) => {
        setSelectedCenter({
            ...selectedCenter,
            status: newStatus as "Active" | "Recovery" | "Closed",
        });
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    };

    const eventColumns = [
        { key: "eventName", label: "Event Name", className: "max-w-[150px] truncate" },
        { key: "eventType", label: "Event Type", className: "max-w-[150px] truncate" },
        { key: "dateDeclared", label: "Date Declared" },
        { key: "endDate", label: "End Date" },
        { key: "status", label: "Status" },
    ];

    const statsData: Stats[] = [
        { label: "Total Checked In", value: "300", max: "1000", percentage: 30 },
        { label: "Total Checked Out", value: "271", max: "500", percentage: 54 },
        { label: "Total Missing", value: "5", max: "", percentage: 0 },
        { label: "Total Unaccounted", value: "429", max: "1000", percentage: 43 },
    ];

    const processedData = useMemo(() => {
        let filtered = eventHistoryData.filter(row =>
            Object.values(row).some(value =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        // Only sort if sortColumn is not empty
        if (sortColumn) {
            filtered = [...filtered].sort((a: any, b: any) => {
                const aValue = a[sortColumn];
                const bValue = b[sortColumn];

                // Handle null/undefined values
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                // String comparison (case-insensitive for text)
                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortDirection === "asc"
                        ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
                        : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
                }

                // Numeric comparison
                if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
                if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [eventHistoryData, searchQuery, sortColumn, sortDirection]);

    const totalPages = Math.ceil(processedData.length / entriesPerPage);
    const paginatedData = processedData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative">
            <ErrorAlert error={error} />

            <MapPanel
                isPanelVisible={isPanelVisible}
                setIsPanelVisible={setIsPanelVisible}
                selectedCenter={selectedCenter}
                isLoadingCenter={isLoadingCenter}
                onStatusChange={handleStatusChange}
                getCenterStatusStyles={getCenterStatusStyles}
                getUsageColor={getUsageColor}
            />

            <StatsRow statsData={statsData} isLoadingStats={isLoadingStats} />

            <EventHistoryTable
                eventColumns={eventColumns}
                paginatedData={paginatedData}
                processedData={processedData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                entriesPerPage={entriesPerPage}
                onEntriesPerPageChange={handleEntriesPerPageChange}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
                isLoadingEvents={isLoadingEvents}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
            />

            <EventDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventData={selectedEvent}
            />
        </div>
    );
}
