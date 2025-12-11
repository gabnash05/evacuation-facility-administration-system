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

interface AidAllocationFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    centers?: Array<{ id: number; name: string }>;
    initialData?: any;
    title?: string;
    submitText?: string;
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

export function AidAllocationForm({
    isOpen,
    onClose,
    onSubmit,
    centers = [],
    initialData = {},
    title = "Allocate Aid",
    submitText = "Allocate Aid",
}: AidAllocationFormProps) {
    const [formData, setFormData] = useState({
        center_id: initialData.center_id || "",
        category_id: initialData.category_id || "",
        event_id: initialData.event_id || "",
        resource_name: initialData.resource_name || "",
        quantity: initialData.quantity || "",
        distribution_rule: initialData.distribution_rule || "", // Empty by default
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // State for dynamic data
    const [activeCenters, setActiveCenters] = useState<Array<{ id: number; name: string }>>(centers);
    const [aidCategories, setAidCategories] = useState<AidCategory[]>([]);
    const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
    const [loading, setLoading] = useState({
        centers: false,
        categories: false,
        events: false,
    });

    // Refs to prevent auto-focus
    const firstSelectRef = useRef<HTMLButtonElement>(null);
    const resourceNameInputRef = useRef<HTMLInputElement>(null);

    // Fetch active evacuation centers if not provided
    useEffect(() => {
        if (isOpen && centers.length === 0) {
            fetchActiveCenters();
        }
        if (isOpen) {
            fetchAidCategories();
        }
    }, [isOpen, centers.length]);

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
                sortBy: "center_name", // Sort by name as requested
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
                // Keep the order as received from database (don't sort)
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
                status: "active",
                limit: 100,
                sortBy: "date_declared", // Sort by date declared
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
            console.error("Error fetching active events:", error);
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
        
        // Reset dependent fields when center changes
        if (field === "center_id") {
            setFormData(prev => ({ 
                ...prev, 
                event_id: "",
                [field]: value 
            }));
        }
    };

    const handleQuantityChange = (operation: 'increment' | 'decrement') => {
        const currentValue = parseInt(formData.quantity) || 0;
        const newValue = operation === 'increment' ? currentValue + 1 : Math.max(1, currentValue - 1);
        
        setFormData(prev => ({ ...prev, quantity: newValue.toString() }));
        
        // Clear quantity error if it exists
        if (errors.quantity) {
            setErrors(prev => ({ ...prev, quantity: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.center_id) newErrors.center_id = "Evacuation center is required";
        if (!formData.category_id) newErrors.category_id = "Category is required";
        if (!formData.event_id) newErrors.event_id = "Event is required";
        if (!formData.resource_name.trim()) newErrors.resource_name = "Relief type is required";
        if (!formData.quantity || Number(formData.quantity) <= 0) 
            newErrors.quantity = "Quantity must be greater than 0";
        if (!formData.distribution_rule) newErrors.distribution_rule = "Distribution rule is required";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            // Map frontend form fields to backend expected payload
            const payload = {
                center_id: Number(formData.center_id),
                category_id: Number(formData.category_id),
                event_id: Number(formData.event_id),
                resource_name: formData.resource_name,
                total_quantity: Number(formData.quantity),           // backend expects total_quantity
                distribution_type: formData.distribution_rule,      // backend expects distribution_type
                // optional fields can be added here if needed (description, notes, suggested_amount)
            };

            onSubmit(payload);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            center_id: "",
            category_id: "",
            event_id: "",
            resource_name: "",
            quantity: "",
            distribution_rule: "", // Reset to empty
        });
        setErrors({});
        setActiveEvents([]);
        onClose();
    };

    // Function to prevent auto-focus
    const handleOpenAutoFocus = (event: Event) => {
        event.preventDefault();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="max-w-md"
                onOpenAutoFocus={handleOpenAutoFocus}  // Prevent auto-focus when dialog opens
                onCloseAutoFocus={(event) => event.preventDefault()}  // Prevent auto-focus when dialog closes
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* Active Evacuation Center */}
                    <div className="space-y-2">
                        <Label htmlFor="center_id" className="font-semibold">
                            Active Evacuation Center
                        </Label>
                        <Select
                            value={formData.center_id}
                            onValueChange={(value) => handleChange("center_id", value)}
                            disabled={loading.centers}
                        >
                            <SelectTrigger 
                                className={`w-full ${errors.center_id ? "border-destructive" : ""}`}
                                ref={firstSelectRef}  // Correct ref type for button element
                            >
                                <SelectValue placeholder={
                                    loading.centers ? "Loading centers..." : "Select evacuation center"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCenters.length > 0 ? (
                                    activeCenters.map(center => (
                                        <SelectItem key={center.id} value={center.id.toString()}>
                                            {center.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-centers" disabled>
                                        No active centers available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.center_id && (
                            <p className="text-sm text-destructive">{errors.center_id}</p>
                        )}
                    </div>

                    {/* Event */}
                    <div className="space-y-2">
                        <Label htmlFor="event_id" className="font-semibold">
                            Event
                        </Label>
                        <Select
                            value={formData.event_id}
                            onValueChange={(value) => handleChange("event_id", value)}
                            disabled={!formData.center_id || loading.events}
                        >
                            <SelectTrigger 
                                className={`w-full ${errors.event_id ? "border-destructive" : ""}`}
                            >
                                <SelectValue placeholder={
                                    !formData.center_id 
                                        ? "Select a center first" 
                                        : loading.events 
                                            ? "Loading events..." 
                                            : "Select event"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {activeEvents.length > 0 ? (
                                    activeEvents.map(event => (
                                        <SelectItem key={event.event_id} value={event.event_id.toString()}>
                                            {event.event_name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-events" disabled>
                                        {formData.center_id ? "No active events for this center" : "Select a center first"}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.event_id && (
                            <p className="text-sm text-destructive">{errors.event_id}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category_id" className="font-semibold">
                            Category
                        </Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => handleChange("category_id", value)}
                            disabled={loading.categories}
                        >
                            <SelectTrigger 
                                className={`w-full ${errors.category_id ? "border-destructive" : ""}`}
                            >
                                <SelectValue placeholder={
                                    loading.categories ? "Loading categories..." : "Select category"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {aidCategories.length > 0 ? (
                                    aidCategories.map(category => (
                                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                            {category.category_name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-categories" disabled>
                                        No categories available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.category_id && (
                            <p className="text-sm text-destructive">{errors.category_id}</p>
                        )}
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
                            autoFocus={false}
                            tabIndex={-1}  // Prevent tab focus
                        />
                        {errors.resource_name && (
                            <p className="text-sm text-destructive">{errors.resource_name}</p>
                        )}
                    </div>

                    {/* Quantity to Allocate */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="font-semibold">
                            Quantity to Allocate
                        </Label>
                        <div className="relative w-full">
                            <Input
                                id="quantity"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.quantity}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleChange("quantity", value);
                                }}
                                className={`w-full pr-16 ${errors.quantity ? "border-destructive" : ""}`}
                                placeholder="e.g., 450"
                                autoComplete="off"
                                autoFocus={false}
                                tabIndex={-1}  // Prevent tab focus
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col border-l border-input">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('increment')}
                                    className="flex-1 flex items-center justify-center px-3 border-b border-input hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Increase quantity"
                                    tabIndex={-1}  // Prevent tab focus
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('decrement')}
                                    className="flex-1 flex items-center justify-center px-3 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Decrease quantity"
                                    tabIndex={-1}  // Prevent tab focus
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity}</p>
                        )}
                    </div>

                    {/* Distribution Rule */}
                    <div className="space-y-3">
                        <Label className="font-semibold block">Distribution Rule</Label>
                        {errors.distribution_rule && (
                            <p className="text-sm text-destructive">{errors.distribution_rule}</p>
                        )}
                        <div className="flex space-x-6">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_individual"
                                    name="distribution_rule"
                                    value="per_individual"
                                    checked={formData.distribution_rule === "per_individual"}
                                    onChange={(e) => handleChange("distribution_rule", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    tabIndex={-1}  // Prevent tab focus
                                />
                                <Label 
                                    htmlFor="per_individual" 
                                    className="ml-2 cursor-pointer select-none"
                                    tabIndex={-1}  // Prevent tab focus
                                >
                                    Per Individual
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_household"
                                    name="distribution_rule"
                                    value="per_household"
                                    checked={formData.distribution_rule === "per_household"}
                                    onChange={(e) => handleChange("distribution_rule", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    tabIndex={-1}  // Prevent tab focus
                                />
                                <Label 
                                    htmlFor="per_household" 
                                    className="ml-2 cursor-pointer select-none"
                                    tabIndex={-1}  // Prevent tab focus
                                >
                                    Per Household
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}