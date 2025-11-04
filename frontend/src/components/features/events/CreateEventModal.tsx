"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddCenterModal } from "@/components/features/events/AddCenterModal";

interface EvacuationCenter {
  centerId: number;
  centerName: string;
  barangay: string;
  capacity: number;
  currentOccupancy: number;
  occupancy: string;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => void;
  initialData?: Event;
}

interface Event {
  eventId: number;
  eventName: string;
  eventType: string;
  dateDeclared: string;
  endDate: string;
  status: "Active" | "Monitoring" | "Resolved";
}

export function CreateEventModal({ isOpen, onClose, onSubmit, initialData }: CreateEventModalProps) {
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [dateDeclared, setDateDeclared] = useState<Date>();
  const [endDate, setEndDate] = useState<Date | "N/A">("N/A");
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [isAddCenterOpen, setIsAddCenterOpen] = useState(false);

  // Parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr || dateStr === "NA") return undefined;
    
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return undefined;
    
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Initialize form with initialData when editing
  useEffect(() => {
    if (initialData && isOpen) {
      setEventTitle(initialData.eventName);
      setEventType(initialData.eventType);
      setStatus(initialData.status);
      setDateDeclared(parseDate(initialData.dateDeclared));
      setEndDate(initialData.endDate === "NA" ? "N/A" : parseDate(initialData.endDate) || "N/A");
      
      // When editing, we could fetch the event's centers here if needed
      // For now, start with empty centers since we can't modify them via update
      setEvacuationCenters([]);
    } else if (isOpen) {
      handleReset();
    }
  }, [initialData, isOpen]);

  const handleAddEvent = () => {
    const eventData = {
      eventTitle,
      eventType,
      status,
      dateDeclared: dateDeclared ? format(dateDeclared, "dd/MM/yyyy") : "",
      endDate: endDate === "N/A" ? "NA" : endDate ? format(endDate, "dd/MM/yyyy") : "NA",
      centerIds: evacuationCenters.map(c => c.centerId)
    };
    onSubmit(eventData);
    handleClose();
  };

  const handleReset = () => {
    setEventTitle("");
    setEventType("");
    setStatus("Active");
    setDateDeclared(undefined);
    setEndDate("N/A");
    setEvacuationCenters([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleRemoveCenter = (index: number) => {
    setEvacuationCenters(evacuationCenters.filter((_, i) => i !== index));
  };

  const handleAddCenters = (centers: any[]) => {
    const newCenters: EvacuationCenter[] = centers.map(c => ({
      centerId: c.id,
      centerName: c.centerName,
      barangay: c.barangay,
      capacity: c.capacity,
      currentOccupancy: c.currentOccupancy,
      occupancy: c.occupancy
    }));
    
    // Avoid duplicates
    const existingIds = new Set(evacuationCenters.map(c => c.centerId));
    const filtered = newCenters.filter(c => !existingIds.has(c.centerId));
    
    setEvacuationCenters([...evacuationCenters, ...filtered]);
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
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
  };

  const isFormValid = eventTitle && eventType && dateDeclared;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {initialData ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </DialogHeader>

          {/* Event Info Section */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <label className="text-xs text-muted-foreground">Event Title</label>
              <Input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Event Type</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="mt-1 w-[275px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fire">Fire</SelectItem>
                  <SelectItem value="Flood">Flood</SelectItem>
                  <SelectItem value="Typhoon">Typhoon</SelectItem>
                  <SelectItem value="Earthquake">Earthquake</SelectItem>
                  <SelectItem value="Landslide">Landslide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`mt-1 w-[275px] ${getStatusColor(status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Date Declared</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !dateDeclared && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDeclared ? format(dateDeclared, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateDeclared}
                    onSelect={setDateDeclared}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      endDate === "N/A" && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate === "N/A" ? "N/A" : endDate ? format(endDate, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3 border-b">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEndDate("N/A")}
                    >
                      Set as N/A
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={endDate === "N/A" ? undefined : endDate}
                    onSelect={(date) => setEndDate(date || "N/A")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Evacuation Centers Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Evacuation Centers Affected</h3>
              <Button onClick={() => setIsAddCenterOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {initialData ? "Update Centers" : "Add Center"}
              </Button>
            </div>
              <div className="border border-border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Center Name</TableHead>
                      <TableHead className="min-w-[120px]">Barangay</TableHead>
                      <TableHead className="min-w-[100px]">Capacity</TableHead>
                      <TableHead className="min-w-[150px]">Current Occupancy</TableHead>
                      <TableHead className="min-w-[120px]">Occupancy</TableHead>
                      <TableHead className="min-w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evacuationCenters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No evacuation centers added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      evacuationCenters.map((center, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{center.centerName}</TableCell>
                          <TableCell>{center.barangay}</TableCell>
                          <TableCell>{center.capacity}</TableCell>
                          <TableCell>{center.currentOccupancy}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded text-xs font-medium inline-block ${getOccupancyColor(center.occupancy)}`}>
                              {center.occupancy}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCenter(i)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

          {/* Footer Button */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleAddEvent} 
              className="gap-2 bg-green-600 hover:bg-green-700"
              disabled={!isFormValid}
            >
              <Plus className="h-4 w-4" />
              {initialData ? "Update Event" : "Add Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Center Modal */}
      <AddCenterModal
        isOpen={isAddCenterOpen}
        onClose={() => setIsAddCenterOpen(false)}
        onAddCenters={handleAddCenters}
      />
    </>
  );
}