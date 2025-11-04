"use client";

import { useState, useMemo } from "react";
import {
  SquarePen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  ChevronsUpDown,
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
import { AddCenterModal } from "@/components/features/events/AddCenterModal";

interface Event {
  id: number;
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

// Generate dummy events data
const generateDummyEvents = () => {
  const eventTypes = ["Fire", "Flood", "Typhoon", "Earthquake", "Landslide"];
  const statuses: ("Active" | "Monitoring" | "Resolved")[] = ["Active", "Monitoring", "Resolved"];
  const barangays = [
    "Hinaplanon", "Palao", "Mahayahay", "Tibanga", "San Miguel", 
    "Sta. Felomina", "Tominobo", "Upper Hinaplanon", "Puga-an", "Dalipuga"
  ];

  const events: Event[] = [];
  
  for (let i = 1; i <= 30; i++) {
    const barangay = barangays[Math.floor(Math.random() * barangays.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const dateDeclared = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/2024`;
    const endDate = status === "Active" ? "NA" : dateDeclared;
    
    events.push({
      id: i,
      eventName: `${barangay} ${eventType}`,
      eventType: eventType,
      dateDeclared: dateDeclared,
      endDate: endDate,
      status: status
    });
  }
  
  return events;
};

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

  const allEvents = useMemo(() => generateDummyEvents(), []);

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

  const handleCreateEvent = (eventData: any) => {
    console.log("Create event:", eventData);
    // TODO: API call to create event
  };

  const handleEditEvent = (row: Event) => {
    setEditingEvent(row);
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = (eventData: any) => {
    console.log("Update event:", editingEvent?.id, eventData);
    // TODO: API call to update event
  };

  const handleDeleteEvent = (row: Event) => {
    console.log("Delete event:", row.id);
    // TODO: API call to delete event
  };

  const handleRowClick = async (row: Event) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock event details data
      const eventDetails: EventDetails = {
        eventTitle: row.eventName,
        eventType: row.eventType,
        status: row.status,
        dateDeclared: row.dateDeclared,
        endDate: row.endDate,
        evacuationCenters: [
          {
            centerName: "San Lorenzo Parish Church",
            barangay: "Hinaplanon",
            capacity: 500,
            currentOccupancy: 400,
            occupancy: "80%"
          },
          {
            centerName: "Don Juana Elementary School",
            barangay: "Palao",
            capacity: 500,
            currentOccupancy: 300,
            occupancy: "60%"
          }
        ]
      };
      
      setSelectedEvent(eventDetails);
      setIsDetailsModalOpen(true);
    } catch (err) {
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
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
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
    
    return sortConfig.direction 
      ? <ChevronsUpDown className="h-4 w-4 text-foreground" />
      : <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
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
              {paginatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <SearchIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No events found</p>
                </div>
              ) : (
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
                    {paginatedData.map((row, i) => (
                      <TableRow
                        key={row.id}
                        className={`${i % 2 === 1 ? "bg-muted" : ""} cursor-pointer hover:bg-muted/50 transition-colors`}
                        onClick={() => handleRowClick(row)}
                      >
                        {eventColumns.map((column) => (
                          <TableCell key={column.key} className={column.key === eventColumns[0].key ? "font-medium" : ""}>
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
                    ))}
                  </TableBody>
                </Table>
              )}
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

      {/* Edit Event Modal (reuses CreateEventModal with initial data) */}
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