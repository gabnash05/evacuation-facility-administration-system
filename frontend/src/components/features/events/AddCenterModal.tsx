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

// Mock data for available evacuation centers
const generateAvailableCenters = (): Center[] => {
  const barangays = [
    "Hinaplanon", "Palao", "Mahayahay", "Tibanga", "San Miguel", 
    "Sta. Felomina", "Tominobo", "Upper Hinaplanon", "Puga-an", "Dalipuga",
    "Buru-un", "Suarez", "Tambo", "Ubaldo Laya", "Villa Verde"
  ];
  
  const centerTypes = [
    "Elementary School", "National High School", "Barangay Hall", 
    "Gymnasium", "Community Center", "Parish Church", "Covered Court"
  ];

  const centers: Center[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const barangay = barangays[i - 1];
    const centerType = centerTypes[Math.floor(Math.random() * centerTypes.length)];
    const capacity = Math.floor(Math.random() * 500) + 100;
    const currentOccupancy = Math.floor(Math.random() * capacity);
    const occupancy = Math.round((currentOccupancy / capacity) * 100);
    
    centers.push({
      id: i,
      centerName: `${barangay} ${centerType}`,
      barangay: barangay,
      status: Math.random() > 0.3 ? "Active" : "Inactive",
      capacity: capacity,
      currentOccupancy: currentOccupancy,
      occupancy: `${occupancy}%`
    });
  }
  
  return centers;
};

export function AddCenterModal({ isOpen, onClose, onAddCenters }: AddCenterModalProps) {
  const [availableCenters, setAvailableCenters] = useState<Center[]>([]);
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setAvailableCenters(generateAvailableCenters());
    }
  }, [isOpen]);

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
    onClose();
  };

  const getOccupancyColor = (occupancy: string) => {
    const percentage = parseInt(occupancy);
    if (percentage >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Center</DialogTitle>
        </DialogHeader>

        {/* Centers Table */}
        <div className="mt-4 border border-border rounded-lg overflow-x-auto">
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
                    <TableCell>{center.status}</TableCell>
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
        </div>

        {/* Footer with selected count and button */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            {selectedCenterIds.size} center{selectedCenterIds.size !== 1 ? 's' : ''} selected
          </p>
          <Button 
            onClick={handleAddCenters} 
            className="gap-2 bg-green-600 hover:bg-green-700"
            disabled={selectedCenterIds.size === 0}
          >
            <Plus className="h-4 w-4" />
            Add Centers ({selectedCenterIds.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}