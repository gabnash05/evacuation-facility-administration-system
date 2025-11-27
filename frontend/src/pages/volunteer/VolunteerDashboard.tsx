"use client";

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRoundCheck, Ambulance, HousePlus, HandHeart } from "lucide-react";
import { EventsTable } from "@/components/features/events/EventsTable";
import { useEventStore } from "@/store/eventStore";
import { formatDate } from "@/utils/formatters";
import type { Event } from "@/types/event";
import { useAuthStore } from "@/store/authStore";

export function VolunteerDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc" | null;
    } | null>(null);

    // Use event store
    const {
        events,
        loading: isLoadingEvents,
        error,
        pagination,
        fetchEvents,
        getEventDetails,
    } = useEventStore();

    // Get current user and role
    const { user } = useAuthStore();
    const userRole = user?.role;
    const userCenterId = user?.center_id;

    // Fetch events filtered by the volunteer's center_id
    useEffect(() => {
        if (userCenterId) {
            fetchEvents(userCenterId);
        } else {
            fetchEvents(); // Fallback to all events if no center_id
        }
    }, [fetchEvents, searchQuery, currentPage, entriesPerPage, sortConfig, userCenterId]);

    const handleSort = (column: string): void => {
        const currentSortConfig = sortConfig;

        let newDirection: "asc" | "desc" | null = "asc";

        if (currentSortConfig?.key === column) {
            if (currentSortConfig.direction === "asc") {
                newDirection = "desc";
            } else if (currentSortConfig.direction === "desc") {
                newDirection = null;
            }
        }

        setSortConfig(newDirection ? { key: column, direction: newDirection } : null);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
    };

    const handleRowClick = async (event: Event) => {
        try {
            await getEventDetails(event.event_id);
        } catch (err) {
            console.error("Event details error:", err);
        }
    };

    // Volunteer dashboard specific handlers - these are empty since volunteers can't modify events
    const handleEditEvent = (event: Event) => {
        // Volunteers cannot edit events
        console.log("Volunteers cannot edit events");
    };

    const handleDeleteEvent = (event: Event) => {
        // Volunteers cannot delete events
        console.log("Volunteers cannot delete events");
    };

    // Handle button clicks
    const handleAttendanceClick = () => {
        navigate("/volunteer/attendance");
    };

    const handleTransferClick = () => {
        navigate("/volunteer/transfer-individual");
    };

    const handleHouseholdClick = () => {
        navigate("/volunteer/households");
    };

    const handleReliefClick = () => {
        navigate("/volunteer/aid-distribution");
    };

    const formattedEvents = useMemo(() => {
        return events.map(event => ({
            ...event,
            status: event.status.charAt(0).toUpperCase() + event.status.slice(1),
            date_declared: formatDate(event.date_declared),
            end_date: event.end_date ? formatDate(event.end_date) : "NA",
            capacity: event.capacity || 0,
            max_occupancy: event.max_occupancy || 0,
            usage_percentage: event.overall_usage_percentage || 0,
        }));
    }, [events]);

    const totalPages = pagination?.total_pages || 1;

    const processedData = formattedEvents;
    const paginatedData = processedData;

    return (
        <div className="w-full min-w-0 bg-background flex flex-col">
            {/* Quick Action Section */}
            <div className="p-none mt-12">
                <h2 className="text-2xl font-semibold text-center mb-8">Quick Action</h2>

                <div className="flex justify-center gap-6 mb-12">
                    {[
                        {
                            label: "Attendance",
                            color: "bg-blue-500",
                            icon: UserRoundCheck,
                            onClick: handleAttendanceClick,
                        },
                        {
                            label: "Transfer Individual",
                            color: "bg-red-500",
                            icon: Ambulance,
                            onClick: handleTransferClick,
                        },
                        {
                            label: "Register Household",
                            color: "bg-orange-500",
                            icon: HousePlus,
                            onClick: handleHouseholdClick,
                        },
                        {
                            label: "Distribute Relief",
                            color: "bg-green-500",
                            icon: HandHeart,
                            onClick: handleReliefClick,
                        },
                    ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div
                                className={`${action.color} w-20 h-20 rounded-lg flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer relative`}
                                onClick={action.onClick}
                            >
                                <action.icon className="w-10 h-10" />
                            </div>
                            <p className="text-sm font-medium text-center">{action.label}</p>
                        </div>
                    ))}
                </div>

                {/* Active Events Section */}
                <div className="border border-border py-4 text-center mb-0">
                    <h2 className="text-2xl font-semibold">
                        Active Events {userCenterId && `for Your Center`}
                    </h2>
                </div>

                {/* EventsTable Component */}
                <EventsTable
                    data={paginatedData}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    loading={isLoadingEvents}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onRowClick={handleRowClick}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
