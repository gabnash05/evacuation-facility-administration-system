"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown } from "lucide-react";

// Import services to fetch data
import { AidAllocationService } from "@/services/aidAllocationService";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import { EventService } from "@/services/eventService";

interface EditAllocationFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: any) => Promise<void>;
    allocation: any; // The allocation data to edit
    title?: string;
    submitText?: string;
    userRole?: string; // optional
}

interface AidCategory {
    category_id: number;
    category_name: string;
    is_active?: boolean;
}

interface ActiveEvent {
    event_id: number;
    event_name: string;
}

export function EditAllocationForm({
    isOpen,
    onClose,
    onSubmit,
    allocation,
    title = "Edit Allocation",
    submitText = "Update Allocation",
}: EditAllocationFormProps) {
    const [formData, setFormData] = useState({
        center_id: "",
        category_id: "",
        event_id: "",
        resource_name: "",
        total_quantity: "",
        distribution_type: "",
        status: "active",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    
    // State for dynamic data
    const [activeCenters, setActiveCenters] = useState<Array<{ id: number; name: string }>>([]);
    const [aidCategories, setAidCategories] = useState<AidCategory[]>([]);
    const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
    const [loading, setLoading] = useState({
        centers: false,
        categories: false,
        events: false,
    });

    const [submitting, setSubmitting] = useState(false);

    // Refs to prevent auto-focus
    const firstSelectRef = useRef<HTMLButtonElement>(null);
    const resourceNameInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill form with allocation data when it changes
    useEffect(() => {
        if (allocation) {
            setFormData({
                center_id: allocation.center_id?.toString() || "",
                category_id: allocation.category_id?.toString() || "",
                event_id: allocation.event_id?.toString() || "",
                resource_name: allocation.resource_name || "",
                total_quantity: allocation.total_quantity?.toString() || "",
                distribution_type: allocation.distribution_type || "",
                status: allocation.status || "active",
            });
        }
    }, [allocation]);

    // Fetch active evacuation centers
    useEffect(() => {
        if (isOpen) {
            fetchActiveCenters();
            fetchAidCategories();
        }
    }, [isOpen]);

    // Fetch events when center changes
    useEffect(() => {
        if (formData.center_id) {
            fetchActiveEvents(parseInt(formData.center_id));
        } else {
            setActiveEvents([]);
        }
    }, [formData.center_id]);

    const fetchActiveCenters = async () => {
        setLoading(prev => ({ ...prev, centers: true }));
        try {
            const response = await EvacuationCenterService.getCenters({
                status: "active",
                limit: 100,
                sortBy: "center_name",
                sortOrder: "asc",
            });
            
            if (response.success && response.data?.results) {
                const centersList = response.data.results.map(center => ({
                    id: center.center_id,
                    name: center.center_name,
                }));
                setActiveCenters(centersList);
            }
        } catch (error) {
            console.error("Error fetching active centers:", error);
            setActiveCenters([]);
        } finally {
            setLoading(prev => ({ ...prev, centers: false }));
        }
    };

    const fetchAidCategories = async () => {
        setLoading(prev => ({ ...prev, categories: true }));
        try {
            const response = await AidAllocationService.getCategories();
            
            if (response.success && response.data) {
                // Filter for active categories and maintain database order
                const activeCategories = response.data.filter(
                    (category: AidCategory) => category.is_active !== false
                );
                setAidCategories(activeCategories);
            }
        } catch (error) {
            console.error("Error fetching aid categories:", error);
            setAidCategories([]);
        } finally {
            setLoading(prev => ({ ...prev, categories: false }));
        }
    };

    const fetchActiveEvents = async (centerId: number) => {
        setLoading(prev => ({ ...prev, events: true }));
        try {
            const response = await EventService.getEvents({
                center_id: centerId,
                limit: 100,
                sortBy: "date_declared",
                sortOrder: "desc",
            });
            
            if (response.success && response.data?.results) {
                const eventsList = response.data.results.map(event => ({
                    event_id: event.event_id,
                    event_name: event.event_name,
                }));
                setActiveEvents(eventsList);
            } else {
                setActiveEvents([]);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            setActiveEvents([]);
        } finally {
            setLoading(prev => ({ ...prev, events: false }));
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
        if (serverError) {
            setServerError(null);
        }
        
        // Reset event when center changes (unless it's the same center)
        if (field === "center_id" && formData.center_id !== value) {
            setFormData(prev => ({ 
                ...prev, 
                event_id: "",
                [field]: value 
            }));
        }
    };

    const handleQuantityChange = (operation: 'increment' | 'decrement') => {
        const currentValue = parseInt(formData.total_quantity) || 0;
        const newValue = operation === 'increment' ? currentValue + 1 : Math.max(1, currentValue - 1);
        
        setFormData(prev => ({ ...prev, total_quantity: newValue.toString() }));
        
        // Clear quantity error if it exists
        if (errors.total_quantity) {
            setErrors(prev => ({ ...prev, total_quantity: "" }));
        }
        if (serverError) {
            setServerError(null);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.center_id) newErrors.center_id = "Evacuation center is required";
        if (!formData.category_id) newErrors.category_id = "Category is required";
        if (!formData.event_id) newErrors.event_id = "Event is required";
        if (!formData.resource_name.trim()) newErrors.resource_name = "Relief type is required";
        if (!formData.total_quantity || Number(formData.total_quantity) <= 0) 
            newErrors.total_quantity = "Quantity must be greater than 0";
        if (!formData.distribution_type) newErrors.distribution_type = "Distribution rule is required";
        if (!formData.status) newErrors.status = "Status is required";

        // Enforce lower limit - cannot set total < remaining
        const originalRemaining = allocation?.remaining_quantity ?? null;
        if (originalRemaining !== null && originalRemaining !== undefined) {
            const newTotal = Number(formData.total_quantity || 0);
            if (newTotal < originalRemaining) {
                newErrors.total_quantity = `Total quantity cannot be less than remaining quantity (${originalRemaining})`;
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        setServerError(null);
        try {
            // Map frontend form fields to backend expected payload
            const payload: any = {
                resource_name: formData.resource_name,
                total_quantity: Number(formData.total_quantity),
                distribution_type: formData.distribution_type,
                status: formData.status,
                category_id: Number(formData.category_id),
                // Note: center_id and event_id cannot be updated per backend restrictions
            };

            // Ensure remaining_quantity is adjusted client-side when total_quantity changes.
            // This guarantees correct remaining update even if backend logic doesn't apply it.
            const originalTotal = allocation?.total_quantity ?? 0;
            const originalRemaining = allocation?.remaining_quantity ?? 0;
            const newTotal = Number(formData.total_quantity || originalTotal);
            const delta = newTotal - originalTotal;

            if (delta > 0) {
                // Increasing total -> increase remaining by same amount
                payload.remaining_quantity = Number(originalRemaining + delta);
            } else if (delta < 0) {
                // Decreasing total -> decrease remaining by same amount but not below 0
                const decreaseAmount = Math.abs(delta);
                payload.remaining_quantity = Number(Math.max(0, originalRemaining - decreaseAmount));
            }
            // If delta === 0, don't include remaining_quantity

            await onSubmit(allocation.allocation_id, payload);
            // onSubmit resolved -> success, close modal
            handleClose();
        } catch (error: any) {
            // Display error inside the modal (don't close). Prefer specific field messages if returned.
            const message = error?.message || String(error);
            // If the backend returned a validation about quantity, attach to total_quantity error
            if (message.toLowerCase().includes("total quantity") || message.toLowerCase().includes("remaining quantity")) {
                setErrors(prev => ({ ...prev, total_quantity: message }));
            } else {
                setServerError(message);
            }
            console.error("Error updating allocation:", message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            center_id: "",
            category_id: "",
            event_id: "",
            resource_name: "",
            total_quantity: "",
            distribution_type: "",
            status: "active",
        });
        setErrors({});
        setServerError(null);
        setActiveEvents([]);
        onClose();
    };

    // Function to prevent auto-focus
    const handleOpenAutoFocus = (event: Event) => {
        event.preventDefault();
    };

    // Status options
    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="max-w-md"
                onOpenAutoFocus={handleOpenAutoFocus}
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* Evacuation Center (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="center_id" className="font-semibold">
                            Evacuation Center
                        </Label>
                        <Select
                            value={formData.center_id}
                            onValueChange={(value) => handleChange("center_id", value)}
                            disabled={true} // Center cannot be changed
                        >
                            <SelectTrigger 
                                className="w-full bg-muted"
                                ref={firstSelectRef}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {loading.centers ? (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                ) : activeCenters.length > 0 ? (
                                    activeCenters.map(center => (
                                        <SelectItem key={center.id} value={center.id.toString()}>
                                            {center.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No active centers
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Event (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="event_id" className="font-semibold">
                            Event
                        </Label>
                        <Select
                            value={formData.event_id}
                            onValueChange={(value) => handleChange("event_id", value)}
                            disabled={true} // Event cannot be changed
                        >
                            <SelectTrigger className="w-full bg-muted">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {loading.events ? (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                ) : activeEvents.length > 0 ? (
                                    activeEvents.map(event => (
                                        <SelectItem key={event.event_id} value={event.event_id.toString()}>
                                            {event.event_name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No events for selected center
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="category_id" className="font-semibold">
                            Category
                        </Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => handleChange("category_id", value)}
                            disabled={true} // Category cannot be changed
                        >
                            <SelectTrigger className="w-full bg-muted">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {loading.categories ? (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                ) : aidCategories.length > 0 ? (
                                    aidCategories.map(category => (
                                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                            {category.category_name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No active categories
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Relief Type */}
                    <div className="space-y-2">
                        <Label htmlFor="resource_name" className="font-semibold">
                            Relief Type
                        </Label>
                        <Input
                            ref={resourceNameInputRef}
                            id="resource_name"
                            value={formData.resource_name}
                            onChange={(e) => handleChange("resource_name", e.target.value)}
                            className={`w-full ${errors.resource_name ? "border-destructive" : ""}`}
                            placeholder="e.g., Food Packs, Medicine, Blankets"
                            autoComplete="off"
                        />
                        {errors.resource_name && (
                            <p className="text-sm text-destructive">{errors.resource_name}</p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="total_quantity" className="font-semibold">
                            Total Quantity
                        </Label>
                        <div className="relative w-full">
                            <Input
                                id="total_quantity"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.total_quantity}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleChange("total_quantity", value);
                                }}
                                className={`w-full pr-16 ${errors.total_quantity ? "border-destructive" : ""}`}
                                placeholder="e.g., 450"
                                autoComplete="off"
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col border-l border-input">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('increment')}
                                    className="flex-1 flex items-center justify-center px-3 border-b border-input hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Increase quantity"
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('decrement')}
                                    className="flex-1 flex items-center justify-center px-3 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Decrease quantity"
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {errors.total_quantity && (
                            <p className="text-sm text-destructive">{errors.total_quantity}</p>
                        )}
                    </div>

                    {/* Distribution Rule */}
                    <div className="space-y-3">
                        <Label className="font-semibold block">Distribution Rule</Label>
                        {errors.distribution_type && (
                            <p className="text-sm text-destructive">{errors.distribution_type}</p>
                        )}
                        <div className="flex space-x-6">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_individual"
                                    name="distribution_type"
                                    value="per_individual"
                                    checked={formData.distribution_type === "per_individual"}
                                    onChange={(e) => handleChange("distribution_type", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <Label 
                                    htmlFor="per_individual" 
                                    className="ml-2 cursor-pointer select-none"
                                >
                                    Per Individual
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_household"
                                    name="distribution_type"
                                    value="per_household"
                                    checked={formData.distribution_type === "per_household"}
                                    onChange={(e) => handleChange("distribution_type", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <Label 
                                    htmlFor="per_household" 
                                    className="ml-2 cursor-pointer select-none"
                                >
                                    Per Household
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Status Field */}
                    <div className="space-y-2">
                        <Label htmlFor="status" className="font-semibold">
                            Status
                        </Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => handleChange("status", value)}
                        >
                            <SelectTrigger className={`w-full ${errors.status ? "border-destructive" : ""}`}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-destructive">{errors.status}</p>
                        )}
                    </div>

                    {/* Server error (generic) */}
                    {serverError && (
                        <div className="bg-destructive/10 text-destructive p-2 rounded">
                            <p className="text-sm">{serverError}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Updating..." : submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}