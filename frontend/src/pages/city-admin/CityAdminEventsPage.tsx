"use client";

import { useState, useMemo, useEffect } from "react";
import {
  SquarePen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Plus,
} from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { CreateEventModal } from "@/components/features/events/CreateEventModal";
import { eventService } from "@/services/eventService";

interface Event {
  eventId: number;
  eventName: string;
  eventType: string;
  dateDeclared: string;
  endDate: string;
  status: "Active" | "Monitoring" | "Resolved";
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

export function CityAdminEventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(8);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await eventService.getAllEvents();
      
      const transformedEvents: Event[] = data.map((event) => ({
        eventId: event.event_id,
        eventName: event.event_name,
        eventType: event.event_type,
        dateDeclared: formatDate(event.date_declared),
        endDate: event.end_date ? formatDate(event.end_date) : "NA",
        status: capitalizeStatus(event.status)
      }));
      
      setAllEvents(transformedEvents);
    } catch (err) {
      setError("Failed to load events. Please try again.");
      console.error("Fetch events error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'NA';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const capitalizeStatus = (status: string): "Active" | "Monitoring" | "Resolved" => {
    const statusMap: Record<string, "Active" | "Monitoring" | "Resolved"> = {
      'active': 'Active',
      'monitoring': 'Monitoring',
      'resolved': 'Resolved'
    };
    return statusMap[status.toLowerCase()] || 'Active';
  };

  const eventColumns = [
    { key: "eventName", label: "Event Name" },
    { key: "eventType", label: "Event Type" },
    { key: "dateDeclared", label: "Date Declared" },
    { key: "endDate", label: "End Date" },
    { key: "status", label: "Status" },
  ];

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      
      switch (current.direction) {
        case 'asc':
          return { key, direction: 'desc' };
        case 'desc':
          return { key, direction: null };
        case null:
        default:
          return { key, direction: 'asc' };
      }
    });
    setCurrentPage(1);
  };

  const handleEntriesPerPageChange = (entries: number) => {
    setEntriesPerPage(entries);
    setCurrentPage(1);
    setSortConfig(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSortConfig(null);
  };

  const handleAddEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      setError(null);
      
      await eventService.createEvent({
        event_name: eventData.event_name,
        event_type: eventData.event_type,
        date_declared: eventData.date_declared,
        end_date: eventData.end_date,
        status: eventData.status,
        center_ids: eventData.center_ids
      });
      
      await fetchEvents();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create event");
      console.error("Create event error:", err);
    }
  };

  const handleEditEvent = (row: Event) => {
    setEditingEvent(row);
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent) return;

    if (new Date(eventData.end_date) < new Date(eventData.date_declared)) {
      setError("End date cannot be earlier than the date declared.");
      return;
    }

    try {
      setError(null);

      // Update basic event info
      await eventService.updateEvent(editingEvent.eventId, {
        event_name: eventData.event_name,
        event_type: eventData.event_type,
        date_declared: eventData.date_declared,
        end_date: eventData.end_date,
        status: eventData.status,
      });

      
      // Handle center associations - ALWAYS process this, even if empty array
      if (eventData.center_ids !== undefined) {
        // Get current centers for this event
        const currentCenters = await eventService.getEventCenters(editingEvent.eventId);
        const currentCenterIds = currentCenters.map(c => c.center_id);
        
        // Find centers to add (in new list but not in current)
        const centersToAdd = eventData.center_ids.filter(
          (id: number) => !currentCenterIds.includes(id)
        );
        
        // Find centers to remove (in current but not in new list)
        const centersToRemove = currentCenterIds.filter(
          id => !eventData.center_ids.includes(id)
        );
        
        // Add new centers
        for (const centerId of centersToAdd) {
          await eventService.addCenterToEvent(editingEvent.eventId, centerId);
        }
        
        // Remove old centers
        for (const centerId of centersToRemove) {
          await eventService.removeCenterFromEvent(editingEvent.eventId, centerId);
        }
      }
      
      await fetchEvents();
      setIsEditModalOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      setError(err.message || "Failed to update event");
      console.error("Update event error:", err);
    }
  };

  const handleDeleteEvent = async (row: Event) => {
    if (!confirm(`Are you sure you want to delete "${row.eventName}"?`)) return;
    
    try {
      setError(null);
      await eventService.deleteEvent(row.eventId);
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || "Failed to delete event");
      console.error("Delete event error:", err);
    }
  };

  const handleRowClick = async (row: Event) => {
    try {
      setError(null);
      
      const apiResponse = await eventService.getEventDetails(row.eventId);
      
      const eventDetails: EventDetails = {
        eventTitle: apiResponse.event_name,
        eventType: apiResponse.event_type,
        status: capitalizeStatus(apiResponse.status),
        dateDeclared: row.dateDeclared,
        endDate: row.endDate,
        evacuationCenters: apiResponse.centers.map((center) => ({
          centerName: center.center_name,
          barangay: center.barangay,
          capacity: center.capacity,
          currentOccupancy: center.current_occupancy,
          occupancy: center.occupancy
        }))
      };
      
      setSelectedEvent(eventDetails);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to load event details");
      console.error("Event details error:", err);
    }
  };

  const processedData = useMemo(() => {
    let filtered = allEvents.filter((row) =>
      Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    if (sortConfig && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // String comparison (case-insensitive for text)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
            : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
        }
        
        // Numeric comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [allEvents, searchQuery, sortConfig]);

  const totalPages = Math.ceil(processedData.length / entriesPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="h-4 w-4 text-foreground" />;
    } else if (sortConfig.direction === 'desc') {
      return <ChevronDown className="h-4 w-4 text-foreground" />;
    } else {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const renderActions = (row: Event, index: number) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEditEvent(row)}>
          <SquarePen className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDeleteEvent(row)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage events and their information</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="border border-border">
          {/* Controls Bar */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={entriesPerPage}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleEntriesPerPageChange(Math.max(1, Math.min(20, value)));
                    }}
                    className="w-16 h-9 px-2 border border-border rounded-lg bg-background 
                    text-foreground font-medium text-center [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:[appearance:auto] 
                    hover:[&::-webkit-outer-spin-button]:appearance-auto hover:[&::-webkit-inner-spin-button]:appearance-auto"
                  />
                  <span>Entries</span>
                  {/* ✅ ADD THIS COUNTER */}
                  <span className="ml-2 text-foreground font-medium">
                    {processedData.length > 0
                      ? `${(currentPage - 1) * entriesPerPage + 1}-${Math.min(currentPage * entriesPerPage, processedData.length)}`
                      : "0-0"}
                  </span>
                  <span>of {processedData.length}</span>
                </div>

                <SearchBar
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex items-center gap-4">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground">
                    {currentPage}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Add Event Button */}
                <Button onClick={handleAddEvent} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="border-t-0">
            <div className="min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {eventColumns.map((column) => (
                      <TableHead key={column.key}>
                        <div
                          className="flex items-center justify-between cursor-pointer hover:text-foreground"
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                          {getSortIcon(column.key)}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={eventColumns.length + 1}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Loading events...
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={eventColumns.length + 1}
                        className="text-center py-10 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <SearchIcon className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-lg font-medium">No events found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, i) => (
                      <TableRow
                        key={row.eventId}
                        className={`${i % 2 === 1 ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 transition-colors`}
                        onClick={() => handleRowClick(row)}
                      >
                        {eventColumns.map((column) => (
                          <TableCell 
                            key={column.key} 
                            className={`
                              ${column.key === eventColumns[0].key ? "font-medium" : ""}
                              ${column.key === "eventName" ? "max-w-[150px] truncate" : ""}
                              ${column.key === "eventType" ? "max-w-[150px] truncate" : ""}
                            `}
                            title={column.key === "eventName" || column.key === "eventType" ? String(row[column.key as keyof Event]) : undefined}
                          >
                            {column.key === "status" ? (
                              <Badge variant="secondary" className={getStatusColor(row[column.key as keyof Event] as string)}>
                                {row[column.key as keyof Event]}
                              </Badge>
                            ) : (
                              row[column.key as keyof Event]
                            )}
                          </TableCell>
                        ))}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {renderActions(row, i)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        eventData={selectedEvent}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />

      {/* Edit Event Modal */}
      {editingEvent && (
        <CreateEventModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={handleUpdateEvent}
          initialData={editingEvent}
        />
      )}
    </div>
  );
}