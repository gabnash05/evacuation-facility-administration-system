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
import { Button } from "@/components/ui/button";
import { Plus, CirclePlus, CircleMinus } from "lucide-react";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import type { EvacuationCenter } from "@/types/center";

interface Center {
  id: number;
  centerName: string;
  barangay: string;
  status: string;
  capacity: number;
  currentOccupancy: number;
  occupancy: string;
}

interface AddCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCenters: (centers: Center[]) => void;
}

export function AddCenterModal({ isOpen, onClose, onAddCenters }: AddCenterModalProps) {
  const [availableCenters, setAvailableCenters] = useState<Center[]>([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCenters();
    }
  }, [isOpen]);

  const fetchCenters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await EvacuationCenterService.getCenters();
      
      // Extract from PaginatedResponse: { success, data: { results: [], pagination: {} } }
      const centersData: EvacuationCenter[] = response.data?.results || [];
      
      const transformedCenters: Center[] = centersData.map((center) => {
        const occupancy = center.capacity > 0 
          ? Math.round((center.current_occupancy / center.capacity) * 100)
          : 0;
        
        const barangay = center.address.includes(',') 
          ? center.address.split(',')[0].trim() 
          : center.address;
        
        return {
          id: center.center_id,
          centerName: center.center_name,
          barangay: barangay,
          status: capitalizeStatus(center.status),
          capacity: center.capacity,
          currentOccupancy: center.current_occupancy,
          occupancy: `${occupancy}%`
        };
      });
      
      setAvailableCenters(transformedCenters);
    } catch (err: any) {
      setError(err.message || "Failed to load evacuation centers");
      console.error("Fetch centers error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleToggleCenter = (centerId: number) => {
    setSelectedCenterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  const handleAddCenters = () => {
    const selectedCenters = availableCenters.filter(center => 
      selectedCenterIds.has(center.id)
    );
    onAddCenters(selectedCenters);
    setSelectedCenterIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedCenterIds(new Set());
    setError(null);
    onClose();
  };

  const getOccupancyColor = (occupancy: string) => {
    const percentage = parseInt(occupancy);
    if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "closed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Center</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}

        <div className="mt-4 border border-border rounded-lg overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p className="text-lg">Loading evacuation centers...</p>
            </div>
          ) : availableCenters.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p className="text-lg">No evacuation centers available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Center Name</TableHead>
                  <TableHead className="min-w-[120px]">Barangay</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Capacity</TableHead>
                  <TableHead className="min-w-[150px]">Current Occupancy</TableHead>
                  <TableHead className="min-w-[120px]">Occupancy</TableHead>
                  <TableHead className="min-w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableCenters.map((center, i) => {
                  const isSelected = selectedCenterIds.has(center.id);
                  return (
                    <TableRow 
                      key={center.id} 
                      className={`${i % 2 === 1 ? "bg-muted" : ""} ${isSelected ? "bg-green-50 dark:bg-green-950" : ""}`}
                    >
                      <TableCell className="font-medium">{center.centerName}</TableCell>
                      <TableCell>{center.barangay}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded text-xs font-medium inline-block ${getStatusColor(center.status)}`}>
                          {center.status}
                        </span>
                      </TableCell>
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
                          onClick={() => handleToggleCenter(center.id)}
                          className="h-8 w-8"
                        >
                          {isSelected ? (
                            <CircleMinus className="h-4 w-4 text-red-600" />
                          ) : (
                            <CirclePlus className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            {selectedCenterIds.size} center{selectedCenterIds.size !== 1 ? 's' : ''} selected
          </p>
          <Button 
            onClick={handleAddCenters} 
            className="gap-2 bg-green-600 hover:bg-green-700"
            disabled={selectedCenterIds.size === 0 || isLoading}
          >
            <Plus className="h-4 w-4" />
            Add Centers ({selectedCenterIds.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}