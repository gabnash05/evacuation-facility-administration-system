"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge"; // ADDED: For location badge
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { DuplicateCenterDialog } from "./DuplicateCenterDialog";
import { ChevronUp, ChevronDown, X, MapPin, CheckCircle } from "lucide-react"; // ADDED: CheckCircle
import MapLocationPicker from "../map/MapLocationPicker";

const numberInputClass = [
    "w-full pr-16 [appearance:textfield]",
    "[&::-webkit-outer-spin-button]:appearance-none",
    "[&::-webkit-inner-spin-button]:appearance-none",
].join(" ");
const chevronButtonClass = [
    "flex flex-1 items-center justify-center border-b border-input px-2",
    "transition-colors hover:bg-muted",
].join(" ");
const finalChevronButtonClass =
    "flex flex-1 items-center justify-center px-2 transition-colors hover:bg-muted";
const coordinateRowClass = "flex items-center gap-2";
const coordinateLabelClass = "text-muted-foreground";
const coordinateValueClass = "rounded bg-muted px-2 py-1 font-mono text-xs";
const foregroundTextClass = "text-sm font-medium text-foreground";
const mutedTextClass = "text-xs text-muted-foreground";
const locationPromptClass = [
    "cursor-pointer rounded-lg border-2 border-dashed border-border bg-background p-6 text-center",
    "transition-colors hover:border-primary/50 hover:bg-accent/50",
].join(" ");
const photoUploadClass = [
    "cursor-pointer rounded-b-lg border-t border-border bg-muted/50 py-2 text-center",
    "transition-colors hover:bg-muted/70",
].join(" ");
const imagePreviewClass = "h-32 w-full rounded-md border border-border object-cover";
const removePhotoClass = [
    "absolute -top-2 -right-2 z-10 rounded-full bg-destructive p-1 text-destructive-foreground",
    "shadow-md transition-colors hover:bg-destructive/90",
].join(" ");
const uploadPath = [
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14",
    "m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2v12a2 2 0 002 2z",
].join("");
const primaryButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90";
const locationCardClass = "rounded-lg border border-input bg-card p-4 shadow-sm";
const locationIconContainerClass = "rounded-full bg-primary/10 p-1";
const locationIconClass = "h-4 w-4 text-primary";
const locationBadgeClass = "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20";
const photoCardClass = "rounded-lg border border-border bg-background";
const photoContentClass = "flex flex-col items-center space-y-3 p-4 pb-2";
const photoNameClass = "max-w-[180px] truncate text-sm font-medium text-foreground";
const photoUploadTextClass = "text-xs font-medium text-muted-foreground";

// Define the form data type that matches what the store expects
interface CenterFormData {
    center_name: string;
    address: string;
    capacity: number;
    current_occupancy: number;
    status: "active" | "inactive" | "closed";
    latitude?: number; // NEW: Add latitude
    longitude?: number; // NEW: Add longitude
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
                className={numberInputClass}
            />
            <div className="absolute right-0 top-0 h-full flex flex-col border-l border-input">
                <button
                    type="button"
                    onClick={handleIncrement}
                    className={chevronButtonClass}
                    disabled={max !== undefined && value >= max}
                >
                    <ChevronUp className="h-3 w-3" />
                </button>
                <button
                    type="button"
                    onClick={handleDecrement}
                    className={finalChevronButtonClass}
                    disabled={min !== undefined && value <= min}
                >
                    <ChevronDown className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

export function AddEvacuationCenterForm({
    isOpen,
    onClose,
    onShowSuccessToast,
}: AddEvacuationCenterFormProps) {
    const { addCenter, loading } = useEvacuationCenterStore();
    const [formData, setFormData] = useState<CenterFormData>({
        center_name: "",
        address: "",
        capacity: 0,
        current_occupancy: 0,
        status: "inactive",
        latitude: undefined, // NEW
        longitude: undefined, // NEW
    });
    const [photo, setPhoto] = useState<File | undefined>(undefined);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [duplicateDialog, setDuplicateDialog] = useState({
        isOpen: false,
        centerName: "",
    });
    const [showMapPicker, setShowMapPicker] = useState(false); // NEW: Map picker state
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                center_name: "",
                address: "",
                capacity: 0,
                current_occupancy: 0,
                status: "inactive",
                latitude: undefined,
                longitude: undefined,
            });
            setPhoto(undefined); // Changed from null to undefined
            setPhotoPreview(null);
            setShowMapPicker(false); // Reset map picker
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

    // NEW: Handle location selection from map
    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
        }));
    };

    // NEW: Handle opening map picker
    const handleOpenMapPicker = () => {
        setShowMapPicker(true);
    };

    // NEW: Handle closing map picker
    const handleCloseMapPicker = () => {
        setShowMapPicker(false);
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file (PNG or JPG)");
                return;
            }

            // Validate file size (max 5MB for base64)
            if (file.size > 5 * 1024 * 1024) {
                alert("Please select an image smaller than 5MB");
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
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // NEW: Validate location is selected
        if (formData.latitude === undefined || formData.longitude === undefined) {
            alert("Please select a location on the map for the evacuation center.");
            return;
        }

        try {
            // Prepare data for store - ensure all required fields are included
            const centerData = {
                center_name: formData.center_name,
                address: formData.address,
                capacity: formData.capacity,
                current_occupancy: formData.current_occupancy,
                status: formData.status,
                latitude: formData.latitude, // Include latitude
                longitude: formData.longitude, // Include longitude
            };

            await addCenter(centerData, photo);
            // Show success toast using the prop
            if (onShowSuccessToast) {
                onShowSuccessToast("Evacuation center added successfully.");
            }
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to add center";
            // Check if the error is about duplicate center name
            if (
                message.includes("already exists") ||
                message.includes("duplicate") ||
                message.includes("name already")
            ) {
                setDuplicateDialog({
                    isOpen: true,
                    centerName: formData.center_name,
                });
            } else {
                alert("Failed to add evacuation center. Please try again.");
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            // Validate file size (max 5MB for base64)
            if (file.size > 5 * 1024 * 1024) {
                alert("Please select an image smaller than 5MB");
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

    const locationSelected = formData.latitude !== undefined && formData.longitude !== undefined;
    const dialogClassName = showMapPicker
        ? "min-w-[65vw] max-w-[85vw] h-[85vh]"
        : "max-w-4xl max-h-[90vh]";

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className={dialogClassName}>
                    <DialogHeader>
                        <DialogTitle>Add evacuation center</DialogTitle>
                        <DialogDescription>
                            Provide the center details and select its location on the map.
                        </DialogDescription>
                    </DialogHeader>
                    {showMapPicker ? (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 min-h-0">
                                <MapLocationPicker
                                    onLocationSelect={handleLocationSelect}
                                    onCancel={handleCloseMapPicker}
                                    initialLocation={
                                        locationSelected
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
                                    disabled={!locationSelected}
                                    className={primaryButtonClass}
                                >
                                    Confirm Location
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Original Form View
                        <div className="flex flex-col h-[calc(90vh-120px)]">
                            {" "}
                            {/* Same height adjustment */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-4 flex-1 overflow-y-auto pr-2"
                            >
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
                                        onChange={e =>
                                            handleInputChange("center_name", e.target.value)
                                        }
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
                                    <Label className="text-sm font-medium">Location</Label>
                                    <div className="space-y-3">
                                        {locationSelected ? (
                                            <div className={locationCardClass}>
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={
                                                                    locationIconContainerClass
                                                                }
                                                            >
                                                                <CheckCircle
                                                                    className={locationIconClass}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={locationBadgeClass}
                                                                >
                                                                    Location Selected
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm space-y-1 pl-7">
                                                            <div className={coordinateRowClass}>
                                                                <span
                                                                    className={coordinateLabelClass}
                                                                >
                                                                    Latitude:
                                                                </span>
                                                                <code
                                                                    className={coordinateValueClass}
                                                                >
                                                                    {formData.latitude.toFixed(6)}°
                                                                </code>
                                                            </div>
                                                            <div className={coordinateRowClass}>
                                                                <span
                                                                    className={coordinateLabelClass}
                                                                >
                                                                    Longitude:
                                                                </span>
                                                                <code
                                                                    className={coordinateValueClass}
                                                                >
                                                                    {formData.longitude.toFixed(6)}°
                                                                </code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleOpenMapPicker}
                                                        className="h-8"
                                                    >
                                                        Change
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={locationPromptClass}
                                                onClick={handleOpenMapPicker}
                                            >
                                                <div className="space-y-3">
                                                    <div className="text-muted-foreground">
                                                        <MapPin className="mx-auto h-12 w-12" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className={foregroundTextClass}>
                                                            Click to select location on map
                                                        </p>
                                                        <p className={mutedTextClass}>
                                                            Required for mapping and proximity
                                                            features
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

                                {/* Photo Upload Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Photo of Evacuation Center
                                    </Label>

                                    {photoPreview ? (
                                        // Image Preview State
                                        <div className={photoCardClass}>
                                            <div className={photoContentClass}>
                                                <div className="relative w-full max-w-[200px]">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className={imagePreviewClass}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemovePhoto}
                                                        className={removePhotoClass}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="text-center">
                                                    <p className={photoNameClass}>{photo?.name}</p>
                                                </div>
                                            </div>
                                            {/* Clickable area at the bottom with no space */}
                                            <div
                                                className={photoUploadClass}
                                                onClick={() => fileInputRef.current?.click()}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                            >
                                                <p className={photoUploadTextClass}>
                                                    Click here to change photo
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        // Empty State
                                        <div
                                            className={locationPromptClass}
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
                                                            d={uploadPath}
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className={foregroundTextClass}>
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

                                {/* Submit Button - Now inside the form but after all content */}
                                <div className="flex justify-end pt-3 border-t pb-4">
                                    <Button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            formData.latitude === undefined ||
                                            formData.longitude === undefined
                                        }
                                        className="px-4 py-2 text-sm font-medium"
                                    >
                                        {loading ? "Adding..." : "+ Add Center"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
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
