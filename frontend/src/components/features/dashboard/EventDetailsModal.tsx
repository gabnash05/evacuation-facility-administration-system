"use client";

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

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: EventDetails | null;
}

export function EventDetailsModal({ isOpen, onClose, eventData }: EventDetailsModalProps) {
  if (!eventData) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Event Details</DialogTitle>
        </DialogHeader>

        {/* Event Info Section */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <label className="text-xs text-muted-foreground">Event Name</label>
            <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
              <p className="text-sm">{eventData.eventTitle}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Event Type</label>
            <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
              <p className="text-sm">{eventData.eventType}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <div className={`rounded-lg px-3 py-2 mt-1 text-center ${getStatusColor(eventData.status)}`}>
              <p className="text-sm font-medium">{eventData.status}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-xs text-muted-foreground">Date Declared</label>
            <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
              <p className="text-sm">{eventData.dateDeclared}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Date</label>
            <div className="border border-border rounded-lg px-3 py-2 mt-1 bg-background">
              <p className="text-sm">{eventData.endDate}</p>
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
                  <TableHead className="min-w-[120px]">Barangay</TableHead>
                  <TableHead className="min-w-[100px]">Capacity</TableHead>
                  <TableHead className="min-w-[150px]">Current Occupancy</TableHead>
                  <TableHead className="min-w-[120px]">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventData.evacuationCenters.map((center, i) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}