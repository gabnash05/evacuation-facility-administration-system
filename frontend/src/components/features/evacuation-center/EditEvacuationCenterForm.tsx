"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { DuplicateCenterDialog } from "./DuplicateCenterDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import type { EvacuationCenter } from "@/types/center";
import { ChevronDown, ChevronUp, X, MapPin } from "lucide-react";
import MapLocationPicker from "../map/MapLocationPicker";

// Define the form data type that matches what the store expects
interface CenterFormData {
    center_name: string;
    address: string;
    capacity: number;
    status: "active" | "inactive" | "closed";
    latitude?: number;
    longitude?: number;
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
    required,
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
    onChange,
}: {
    value: string;
    onChange: (value: "active" | "inactive" | "closed") => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const options = [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "closed", label: "Closed" },
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
                <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                    {options.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value as "active" | "inactive" | "closed");
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md ${
                                value === option.value ? "bg-accent text-accent-foreground" : ""
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

export function EditEvacuationCenterForm({
    isOpen,
    onClose,
    center,
    onShowSuccessToast,
}: EditEvacuationCenterFormProps) {
    const { updateCenter, loading } = useEvacuationCenterStore();
    const [formData, setFormData] = useState<CenterFormData>({
        center_name: "",
        address: "",
        capacity: 0,
        status: "active",
        latitude: undefined,
        longitude: undefined,
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
    const [showMapPicker, setShowMapPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill form when center data changes or dialog opens
    useEffect(() => {
        if (center && isOpen) {
            setFormData({
                center_name: center.center_name,
                address: center.address,
                capacity: center.capacity,
                status: center.status,
                latitude: center.latitude,
                longitude: center.longitude,
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
                status: "active",
                latitude: undefined,
                longitude: undefined,
            });
            setPhoto(undefined);
            setPhotoPreview(null);
            setRemoveExistingPhoto(false);
            setShowMapPicker(false);
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

    // Handle location selection from map
    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
        }));
    };

    // Handle opening map picker
    const handleOpenMapPicker = () => {
        setShowMapPicker(true);
    };

    // Handle closing map picker
    const handleCloseMapPicker = () => {
        setShowMapPicker(false);
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file (PNG or JPG)");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Please select an image smaller than 5MB");
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
            fileInputRef.current.value = "";
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
            const photoToSend = removeExistingPhoto ? "remove" : photo;

            await updateCenter(center.center_id, updateData, photoToSend);
            setConfirmationDialog({ isOpen: false });

            if (onShowSuccessToast) {
                onShowSuccessToast("Changes saved.");
            }

            onClose();
        } catch (error: any) {
            if (
                error.message?.includes("already exists") ||
                error.message?.includes("duplicate") ||
                error.message?.includes("name already")
            ) {
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
        if (file && file.type.startsWith("image/")) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Please select an image smaller than 5MB");
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
                <DialogContent className={`${showMapPicker ? 'min-w-[65vw] max-w-[85vw] h-[85vh]' : 'max-w-4xl max-h-[90vh]'}`}>
                    {showMapPicker ? (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 min-h-0">
                                <MapLocationPicker
                                    onLocationSelect={handleLocationSelect}
                                    onCancel={handleCloseMapPicker}
                                    initialLocation={
                                        formData.latitude && formData.longitude
                                            ? [formData.latitude, formData.longitude]
                                            : null
                                    }
                                    showCoordinates={true}
                                    draggable={true}
                                    className="h-full"
                                />
                            </div>
                            
                            {/* Buttons at the bottom - always visible */}
                            <div className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseMapPicker}
                                >
                                    Back to Form
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCloseMapPicker}
                                    disabled={!formData.latitude || !formData.longitude}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Confirm Location
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Form View
                        <div className="flex flex-col h-[calc(90vh-120px)]">
                            <DialogHeader className="pb-2">
                                <DialogTitle className="text-lg font-semibold">
                                    Edit Evacuation Center
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
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
                                        onChange={e => handleInputChange("center_name", e.target.value)}
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
                                        onChange={e => handleInputChange("address", e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>

                                {/* Location Selection */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Location
                                    </Label>
                                    <div className="space-y-3">
                                        {formData.latitude && formData.longitude ? (
                                            <div className="p-4 border border-green-200 bg-green-50 rounded-md dark:border-green-800 dark:bg-green-950/30">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            <span className="font-medium text-green-700 dark:text-green-300">
                                                                Location Selected
                                                            </span>
                                                        </div>
                                                        <div className="text-sm space-y-1">
                                                            <div>
                                                                <span className="text-muted-foreground">Latitude: </span>
                                                                <span className="font-mono">{formData.latitude.toFixed(6)}°</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Longitude: </span>
                                                                <span className="font-mono">{formData.longitude.toFixed(6)}°</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenMapPicker}
                                                        className="px-3 py-1 text-sm border border-input rounded-md hover:bg-accent transition-colors"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center cursor-pointer hover:border-muted-foreground/50 transition-colors bg-background dark:bg-background"
                                                onClick={handleOpenMapPicker}>
                                                <div className="space-y-3">
                                                    <div className="text-muted-foreground">
                                                        <MapPin className="mx-auto h-12 w-12" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            Click to select location on map
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Required for mapping and proximity features
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Capacity */}
                                <div className="space-y-2">
                                    <Label htmlFor="capacity" className="text-sm font-medium">
                                        Capacity
                                    </Label>
                                    <NumberInputWithChevrons
                                        id="capacity"
                                        value={formData.capacity}
                                        onChange={value => handleInputChange("capacity", value)}
                                        min={1}
                                        max={10000}
                                        placeholder="Enter capacity"
                                        required
                                    />
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-medium">
                                        Status
                                    </Label>
                                    <StatusDropdown
                                        value={formData.status}
                                        onChange={value => handleInputChange("status", value)}
                                    />
                                </div>

                                {/* Photo Upload Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Photo of Evacuation Center
                                    </Label>

                                    {center?.photo_data && !removeExistingPhoto && !photoPreview ? (
                                        // Show existing center photo from backend (base64)
                                        <div className="border border-border rounded-lg bg-background">
                                            <div className="flex flex-col items-center space-y-3 p-4 pb-2">
                                                <div className="relative w-full max-w-[200px]">
                                                    <img
                                                        src={`data:image/jpeg;base64,${center.photo_data}`}
                                                        alt="Current center photo"
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
                                                        Current Photo
                                                    </p>
                                                </div>
                                            </div>
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
                                    ) : removeExistingPhoto ? (
                                        // Show removed photo state
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
                                        // Empty State (no photo at all)
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
                                                        Upload photo
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
                                <div className="flex justify-end pt-3 border-t pb-4">
                                    <Button
                                        type="submit"
                                        disabled={loading || !formData.latitude || !formData.longitude}
                                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium"
                                    >
                                        {loading ? "Updating..." : "Update Center"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
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