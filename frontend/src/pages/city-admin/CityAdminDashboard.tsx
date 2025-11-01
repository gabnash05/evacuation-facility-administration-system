"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, EyeOff, Eye, ChevronLeft, ChevronRight, AlertCircle, Search} from "lucide-react";
import { EventDetailsModal } from "@/components/features/dashboard/EventDetailsModal";
import { DataTable } from "@/components/common/DataTable";
import { SearchBar } from "@/components/common/SearchBar";


const API_BASE_URL = 'http://localhost:5000';

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

export function CityAdminDashboard() {
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
      
      const response = await fetch(`${API_BASE_URL}/api/events/`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      const transformedEvents: Event[] = data.map((event: any) => ({
        eventId: event.event_id,
        eventName: event.event_name,
        eventType: event.event_type,
        dateDeclared: formatDate(event.date_declared),
        endDate: event.end_date ? formatDate(event.end_date) : "NA",
        status: capitalizeStatus(event.status)
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

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    if (percentage >= 20) return "bg-lime-500";
    return "bg-green-500";
  };

  const usagePercentage = Math.round(
    (selectedCenter.currentOccupancy / selectedCenter.capacity) * 100
  );

  const handleRowClick = async (row: Event) => {
    if (!row.eventId) return;
    
    try {
      setIsLoadingEvents(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/events/${row.eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      
      const apiResponse = await response.json();
      
      const eventDetails: EventDetails = {
        eventTitle: apiResponse.event_name,
        eventType: apiResponse.event_type,
        status: capitalizeStatus(apiResponse.status),
        dateDeclared: formatDate(row.dateDeclared),
        endDate: row.endDate,
        evacuationCenters: apiResponse.centers.map((center: any) => ({
          centerName: center.center_name,
          barangay: center.barangay,
          capacity: center.capacity,
          currentOccupancy: center.current_occupancy,
          occupancy: center.occupancy
        }))
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
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedCenter({
      ...selectedCenter,
      status: newStatus as "Active" | "Recovery" | "Closed"
    });
  };

  const eventColumns = [
    { key: "eventName", label: "Event Name" },
    { key: "eventType", label: "Event Type" },
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
    let filtered = eventHistoryData.filter((row) =>
      Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    if (sortColumn) {
      filtered = [...filtered].sort((a: any, b: any) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
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
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* === MAP + RIGHT PANEL === */}
      <div className="relative w-full h-[43vh] border-b border-border flex">
        {/* Map Placeholder */}
        <div className="flex-1 bg-muted/30 flex items-center justify-center text-muted-foreground">
          <p>Map Placeholder</p>
        </div>

        {/* Right Info Panel */}
        {isPanelVisible && (
          <div className="w-[500px] bg-card border-l border-border">
            {isLoadingCenter ? (
              <div className="p-6 space-y-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-10 bg-muted rounded mb-2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex-1">
                    <h2 className="text-3xl font-semibold text-foreground leading-tight line-clamp-3" title={selectedCenter.name}>
                      {selectedCenter.name}
                    </h2>
                  </div>
                  <div className="w-40 h-28 bg-muted rounded-lg" />
                </div>

                <div className="space-y-4">
                  {/* Barangay Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-48 flex-none">
                      <p className="text-xs text-muted-foreground mb-1">Barangay</p>
                      <div className="border border-border rounded-lg px-3 py-2 bg-background flex items-center justify-between">
                        <p className="text-sm font-medium truncate" title={selectedCenter.barangay}>
                          {selectedCenter.barangay}
                        </p>
                        <Map className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                    <div className="w-40 flex-none">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Select value={selectedCenter.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className={`rounded-lg px-3 py-2 text-sm font-medium h-auto w-full ${getStatusStyles(selectedCenter.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Recovery">Recovery</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Capacity, Current, Usage, and Hide Button Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-30">
                      <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                      <div className="border border-border rounded-lg px-3 py-2 bg-background">
                        <p className="text-sm font-medium">{selectedCenter.capacity}</p>
                      </div>
                    </div>
                    <div className="w-30">
                      <p className="text-xs text-muted-foreground mb-1">Current Occupancy</p>
                      <div className="border border-border rounded-lg px-3 py-2 bg-background">
                        <p className="text-sm font-medium">{selectedCenter.currentOccupancy}</p>
                      </div>
                    </div>
                    <div className="w-20">
                      <p className="text-xs text-muted-foreground mb-1">Usage</p>
                      <div className={`border border-border rounded-lg px-3 py-2 text-center ${getUsageColor(usagePercentage)}`}>
                        <p className="text-sm font-semibold text-white">{usagePercentage}%</p>
                      </div>
                    </div>
                    <div className="w-16">
                      <p className="text-xs text-muted-foreground mb-1 opacity-0">Hide</p>
                      <button
                        onClick={() => setIsPanelVisible(false)}
                        className="border border-border rounded-lg px-3 py-2 bg-background hover:bg-muted transition-colors w-full flex items-center justify-center"
                        aria-label="Hide evacuation center information panel"
                        title="Hide panel"
                      >
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show Panel Button (when hidden) */}
        {!isPanelVisible && (
          <button
            onClick={() => setIsPanelVisible(true)}
            className="absolute top-4 right-4 bg-card border border-border rounded-lg px-3 py-2 shadow-md hover:bg-muted transition-colors z-10"
            aria-label="Show evacuation center information panel"
            title="Show panel"
          >
            <Eye className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* === STATS ROW === */}
      <div className="w-full bg-card border-b border-border">
        {isLoadingStats ? (
          <div className="flex justify-around py-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full mb-2" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-around py-4 text-center">
            {statsData.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  {/* Progress Circle */}
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${stat.percentage} ${100 - stat.percentage}`} className="text-blue-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {stat.percentage}%
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{stat.value}</div>
                  {stat.max && <p className="text-sm text-muted-foreground">/{stat.max}</p>}
                </div>
                <p className="text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === EVENT HISTORY TABLE === */}
      <div className="p-0">
        {/* Controls Bar */}
        <div className="bg-card border border-border p-4">
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
                  setEntriesPerPage(Math.max(1, Math.min(20, value)));
                  setCurrentPage(1);
                }}
                className="w-16 h-9 px-2 border border-border rounded-lg bg-background 
                text-foreground font-medium text-center [appearance:textfield]
                 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:[appearance:auto] 
                 hover:[&::-webkit-outer-spin-button]:appearance-auto hover:[&::-webkit-inner-spin-button]:appearance-auto"
              />
              <span>Entries</span>
              <span className="ml-2 text-foreground font-medium">
                {processedData.length > 0 
                  ? `${(currentPage - 1) * entriesPerPage + 1}-${Math.min(currentPage * entriesPerPage, processedData.length)}`
                  : '0-0'
                }
              </span>
              <span>of {processedData.length}</span>
            </div>

            <SearchBar 
              placeholder="Search" 
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Table with Event History and Pagination */}
        <div className="border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-base text-foreground">Event History</h3>
            
            {/* Pagination */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoadingEvents}
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
                disabled={currentPage === totalPages || isLoadingEvents}
                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="min-h-[234px]">
            {isLoadingEvents ? (
              <div className="flex justify-center items-center h-[234px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <DataTable
                  columns={eventColumns}
                  data={paginatedData}
                  onRowClick={handleRowClick}
                  onSort={handleSort}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  showTitle={false}
                />
                {paginatedData.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Search className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No events found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventData={selectedEvent}
      />
    </div>
  );
}