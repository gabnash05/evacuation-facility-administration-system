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
import { ChevronUp, ChevronDown, X } from "lucide-react";

// Define the form data type that matches what the store expects
interface CenterFormData {
  center_name: string;
  address: string;
  capacity: number;
  current_occupancy: number;
  status: "active" | "inactive" | "closed";
}

interface AddEvacuationCenterFormProps {
  isOpen: boolean;
  onClose: () => void;
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

export function AddEvacuationCenterForm({ isOpen, onClose, onShowSuccessToast }: AddEvacuationCenterFormProps) {
  const { addCenter, loading } = useEvacuationCenterStore();
  const [formData, setFormData] = useState<CenterFormData>({
    center_name: "",
    address: "",
    capacity: 0,
    current_occupancy: 0,
    status: "active",
  });
  const [photo, setPhoto] = useState<File | undefined>(undefined); // Changed from null to undefined
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState({
    isOpen: false,
    centerName: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPhoto(undefined); // Changed from null to undefined
      setPhotoPreview(null);
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }

      // Validate file size (max 5MB for base64)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }

      setPhoto(file); // Now this matches the expected type
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(undefined); // Changed from null to undefined
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Pass the photo file to the store - now photo is File | undefined which matches the expected type
      await addCenter(formData, photo);
      // Show success toast using the prop
      if (onShowSuccessToast) {
        onShowSuccessToast("Evacuation center added successfully.");
      }
      onClose();
    } catch (error: any) {
      // Check if the error is about duplicate center name
      if (error.message?.includes("already exists") || error.message?.includes("duplicate") || error.message?.includes("name already")) {
        setDuplicateDialog({
          isOpen: true,
          centerName: formData.center_name,
        });
      } else {
        console.error("Failed to add center:", error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 5MB for base64)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }
      
      setPhoto(file); // Now this matches the expected type
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Evacuation Center</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Center Name */}
            <div className="space-y-2">
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
                className="w-full"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
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
                className="w-full"
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium">
                Capacity
              </Label>
              <NumberInputWithChevrons
                id="capacity"
                value={formData.capacity}
                onChange={(value) => handleInputChange("capacity", value)}
                min={1}
                max={10000}
                placeholder="Enter capacity"
                required
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Photo of Evacuation Center
              </Label>
              
              {photoPreview ? (
                // Image Preview State
                <div className="border border-border rounded-lg bg-background">
                  <div className="flex flex-col items-center space-y-3 p-4 pb-2">
                    <div className="relative w-full max-w-[200px]">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {photo?.name}
                      </p>
                    </div>
                  </div>
                  {/* Clickable area at the bottom with no space */}
                  <div
                    className="cursor-pointer border-t border-border bg-muted/50 hover:bg-muted/70 transition-colors text-center py-2 rounded-b-lg"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <p className="text-xs text-muted-foreground font-medium">
                      Click here to change photo
                    </p>
                  </div>
                </div>
              ) : (
                // Empty State
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors bg-background"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      <svg
                        className="mx-auto h-12 w-12"
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
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG or JPG (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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
            <div className="flex justify-end pt-3 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium"
              >
                {loading ? "Adding..." : "+ Add Center"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Center Name Dialog */}
      <DuplicateCenterDialog
        isOpen={duplicateDialog.isOpen}
        onClose={handleDuplicateDialogClose}
        centerName={duplicateDialog.centerName}
      />
    </>
  );
}