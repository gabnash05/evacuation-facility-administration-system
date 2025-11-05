"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { DuplicateCenterDialog } from "./DuplicateCenterDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import type { EvacuationCenter } from "@/types/center";
import { ChevronDown, ChevronUp, X } from "lucide-react";

// Define the form data type that matches what the store expects
interface CenterFormData {
  center_name: string;
  address: string;
  capacity: number;
  current_occupancy: number;
  status: "active" | "inactive" | "closed";
}

interface EditEvacuationCenterFormProps {
  isOpen: boolean;
  onClose: () => void;
  center: EvacuationCenter | null;
  onShowSuccessToast?: (message: string) => void;
}

// Custom NumberInput component with chevron buttons
function NumberInputWithChevrons({ 
  id, 
  value, 
  onChange, 
  min, 
  max, 
  placeholder,
  required 
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const handleIncrement = () => {
    const newValue = value + 1;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - 1;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        placeholder={placeholder}
        value={value || ""}
        onChange={handleInputChange}
        min={min}
        max={max}
        required={required}
        className="w-full pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute right-0 top-0 h-full flex flex-col border-l border-input">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-1 flex items-center justify-center px-2 hover:bg-muted transition-colors border-b border-input"
          disabled={max !== undefined && value >= max}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex-1 flex items-center justify-center px-2 hover:bg-muted transition-colors"
          disabled={min !== undefined && value <= min}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Status dropdown component (custom implementation)
function StatusDropdown({ 
  value, 
  onChange 
}: {
  value: string;
  onChange: (value: "active" | "inactive" | "closed") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "closed", label: "Closed" }
  ];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 py-2 text-sm bg-background rounded-md border border-input shadow-sm transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-between"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value as "active" | "inactive" | "closed");
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md ${
                value === option.value ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditEvacuationCenterForm({ isOpen, onClose, center, onShowSuccessToast }: EditEvacuationCenterFormProps) {
  const { updateCenter, loading } = useEvacuationCenterStore();
  const [formData, setFormData] = useState<CenterFormData>({
    center_name: "",
    address: "",
    capacity: 0,
    current_occupancy: 0,
    status: "active",
  });
  const [photo, setPhoto] = useState<File | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState({
    isOpen: false,
    centerName: "",
  });
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form when center data changes or dialog opens
  useEffect(() => {
    if (center && isOpen) {
      setFormData({
        center_name: center.center_name,
        address: center.address,
        capacity: center.capacity,
        current_occupancy: center.current_occupancy,
        status: center.status,
      });
      setRemoveExistingPhoto(false);
    }
  }, [center, isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        center_name: "",
        address: "",
        capacity: 0,
        current_occupancy: 0,
        status: "active",
      });
      setPhoto(undefined);
      setPhotoPreview(null);
      setRemoveExistingPhoto(false);
    }
  }, [isOpen]);

  // Clean up object URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleInputChange = (field: keyof CenterFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }

      setPhoto(file);
      setRemoveExistingPhoto(false);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
      if (center?.photo_data && !photo) {
          setRemoveExistingPhoto(true);
          setPhotoPreview(null);
      } else if (photo) {
          setPhoto(undefined);
          setPhotoPreview(null);
          setRemoveExistingPhoto(false);
      } else {
          setRemoveExistingPhoto(false);
          setPhotoPreview(null);
      }
      
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!center) return;
    setConfirmationDialog({ isOpen: true });
  };

  const handleConfirmSave = async () => {
    if (!center) return;

    try {
      const updateData = { ...formData };
      const photoToSend = removeExistingPhoto ? 'remove' : photo;
      
      await updateCenter(center.center_id, updateData, photoToSend);
      setConfirmationDialog({ isOpen: false });
      
      if (onShowSuccessToast) {
        onShowSuccessToast("Changes saved.");
      }
      
      onClose();
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate") || error.message?.includes("name already")) {
        setConfirmationDialog({ isOpen: false });
        setDuplicateDialog({
          isOpen: true,
          centerName: formData.center_name,
        });
      } else {
        console.error("Failed to update center:", error);
        setConfirmationDialog({ isOpen: false });
      }
    }
  };

  const handleCancelSave = () => {
    setConfirmationDialog({ isOpen: false });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }
      
      setPhoto(file);
      setRemoveExistingPhoto(false);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDuplicateDialogClose = () => {
    setDuplicateDialog({
      isOpen: false,
      centerName: "",
    });
  };

  if (!center) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto"> {/* Added max height and scroll */}
          <DialogHeader className="pb-2"> {/* Reduced padding */}
            <DialogTitle className="text-lg font-semibold">Edit Evacuation Center</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-3"> {/* Reduced spacing */}
            {/* Center Name */}
            <div className="space-y-1.5"> {/* Reduced spacing */}
              <Label htmlFor="center_name" className="text-sm font-medium">
                Center Name
              </Label>
              <Input
                id="center_name"
                type="text"
                placeholder="Enter center name"
                value={formData.center_name}
                onChange={(e) => handleInputChange("center_name", e.target.value)}
                required
                className="w-full h-9"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
                className="w-full h-9"
              />
            </div>

            {/* Capacity & Current Occupancy in one row */}
            <div className="grid grid-cols-2 gap-3"> {/* Two columns layout */}
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Capacity
                </Label>
                <NumberInputWithChevrons
                  id="capacity"
                  value={formData.capacity}
                  onChange={(value) => handleInputChange("capacity", value)}
                  min={1}
                  max={10000}
                  placeholder="Capacity"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="current_occupancy" className="text-sm font-medium">
                  Occupancy
                </Label>
                <NumberInputWithChevrons
                  id="current_occupancy"
                  value={formData.current_occupancy}
                  onChange={(value) => handleInputChange("current_occupancy", value)}
                  min={0}
                  placeholder="Occupancy"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <StatusDropdown
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
              />
            </div>

            {/* Photo Upload Section - Compact */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Center Photo
              </Label>
              
              <div className="h-32"> {/* Fixed height container */}
                {center?.photo_data && !removeExistingPhoto && !photoPreview ? (
                  // Show existing center photo from backend (base64)
                  <div className="border border-border rounded-lg bg-background h-full flex flex-col">
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2"> {/* Added min-h-0 and centered content */}
                      <div className="relative flex items-center justify-center w-full h-full max-h-16"> {/* Fixed max height for image area */}
                        <img
                          src={`data:image/jpeg;base64,${center.photo_data}`}
                          alt="Current center photo"
                          className="max-h-full max-w-full object-contain rounded-md border border-border" /* Constrained dimensions */
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md hover:bg-destructive/90 transition-colors z-10"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div className="text-center mt-1 flex-shrink-0"> {/* Prevent shrinking */}
                        <p className="text-xs text-foreground truncate max-w-[120px]">
                          Current Photo
                        </p>
                      </div>
                    </div>
                    <div
                      className="cursor-pointer border-t border-border bg-muted/50 hover:bg-muted/70 transition-colors text-center py-1 rounded-b-lg flex-shrink-0" /* Prevent shrinking */
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <p className="text-xs text-muted-foreground font-medium">
                        Change photo
                      </p>
                    </div>
                  </div>
                ) : removeExistingPhoto ? (
                  // Show removed photo state
                  <div
                    className="border border-dashed border-muted-foreground/25 rounded-lg h-full flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors bg-background"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center p-2">
                      <div className="text-muted-foreground mx-auto">
                        <svg
                          className="mx-auto h-8 w-8"
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
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          Photo removed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to upload
                        </p>
                      </div>
                    </div>
                  </div>
                ) : photoPreview ? (
                  // Show newly uploaded photo preview
                  <div className="border border-border rounded-lg bg-background h-full flex flex-col">
                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2"> {/* Added min-h-0 and centered content */}
                      <div className="relative flex items-center justify-center w-full h-full max-h-16"> {/* Fixed max height for image area */}
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain rounded-md border border-border" /* Constrained dimensions */
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md hover:bg-destructive/90 transition-colors z-10"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div className="text-center mt-1 flex-shrink-0"> {/* Prevent shrinking */}
                        <p className="text-xs text-foreground truncate max-w-[120px]">
                          {photo?.name}
                        </p>
                      </div>
                    </div>
                    <div
                      className="cursor-pointer border-t border-border bg-muted/50 hover:bg-muted/70 transition-colors text-center py-1 rounded-b-lg flex-shrink-0" /* Prevent shrinking */
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <p className="text-xs text-muted-foreground font-medium">
                        Click to change photo
                      </p>
                    </div>
                  </div>
                ) : (
                  // Empty State (no photo at all)
                  <div
                    className="border border-dashed border-muted-foreground/25 rounded-lg h-full flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors bg-background"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center p-2">
                      <div className="text-muted-foreground mx-auto">
                        <svg
                          className="mx-auto h-8 w-8"
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
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          Upload photo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG or JPG (max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 text-sm font-medium h-8"
              >
                {loading ? "Updating..." : "Update Center"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Save Changes?"
        message="Are you sure you want to save these changes?"
        loading={loading}
      />

      {/* Duplicate Center Name Dialog */}
      <DuplicateCenterDialog
        isOpen={duplicateDialog.isOpen}
        onClose={handleDuplicateDialogClose}
        centerName={duplicateDialog.centerName}
      />
    </>
  );
}