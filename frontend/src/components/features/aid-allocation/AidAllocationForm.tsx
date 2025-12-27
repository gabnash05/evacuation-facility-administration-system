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
import { ChevronUp, ChevronDown, Calculator, Users, Home, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import services to fetch data
import { AidAllocationService } from "@/services/aidAllocationService";
import { EvacuationCenterService } from "@/services/evacuationCenterService";
import { EventService } from "@/services/eventService";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useHouseholdStore } from "@/store/householdStore";
import { useEventStore } from "@/store/eventStore"; // ADD THIS IMPORT

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
        distribution_type: initialData.distribution_type || "", // Changed from distribution_rule to distribution_type
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
        calculating: false,
    });
    
    // State for recommended quantity calculation
    const [recommendedQuantity, setRecommendedQuantity] = useState<number | null>(null);
    const [calculationInfo, setCalculationInfo] = useState<string>("");
    const [currentOccupancy, setCurrentOccupancy] = useState<number | null>(null);
    const [householdCount, setHouseholdCount] = useState<number | null>(null);
    
    // ADD STATE FOR ACTIVE EVENT (LIKE IN CHECKINMODAL)
    const [activeEvent, setActiveEvent] = useState<any>(null);
    const [eventsLoading, setEventsLoading] = useState(false);

    // Refs to prevent auto-focus
    const firstSelectRef = useRef<HTMLButtonElement>(null);
    const resourceNameInputRef = useRef<HTMLInputElement>(null);
    
    // Get store methods
    const { fetchCurrentCenterOccupancy, getCachedCenterOccupancy } = useAttendanceStore();
    const { fetchCenterHouseholdCount, getCachedCenterHouseholdCount } = useHouseholdStore();
    const { activeEvent: storeActiveEvent, fetchActiveEvent } = useEventStore(); // GET FROM STORE

    // Fetch active evacuation centers if not provided
    useEffect(() => {
        if (isOpen && centers.length === 0) {
            fetchActiveCenters();
        }
        if (isOpen) {
            fetchAidCategories();
            fetchActiveEvent(); // FETCH ACTIVE EVENT LIKE IN CHECKINMODAL
        }
    }, [isOpen, centers.length, fetchActiveEvent]); // ADD DEPENDENCY

    // UPDATE: Use the active event from store
    useEffect(() => {
        if (storeActiveEvent) {
            setActiveEvent(storeActiveEvent);
            // Auto-set the event_id in form data if not already set
            if (!formData.event_id) {
                setFormData(prev => ({ ...prev, event_id: storeActiveEvent.event_id.toString() }));
            }
        }
    }, [storeActiveEvent]);

    // Fetch events and calculate recommended quantity when center changes
    useEffect(() => {
        if (formData.center_id) {
            const centerId = parseInt(formData.center_id);
            calculateRecommendedQuantity(centerId);
        } else {
            setActiveEvents([]);
            resetRecommendedQuantity();
        }
    }, [formData.center_id]);

    // Recalculate recommended quantity when distribution type changes
    useEffect(() => {
        if (formData.center_id) {
            const centerId = parseInt(formData.center_id);
            calculateRecommendedQuantity(centerId);
        }
    }, [formData.distribution_type, currentOccupancy, householdCount]);

    // Auto-fill quantity with recommended value when it changes
    useEffect(() => {
        if (recommendedQuantity !== null && recommendedQuantity > 0) {
            setFormData(prev => ({
                ...prev,
                quantity: recommendedQuantity.toString()
            }));
            // Clear quantity error if it exists
            if (errors.quantity) {
                setErrors(prev => ({ ...prev, quantity: "" }));
            }
        }
    }, [recommendedQuantity]);

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

    const calculateRecommendedQuantity = async (centerId: number) => {
        if (!formData.distribution_type) {
            resetRecommendedQuantity();
            return;
        }

        setLoading(prev => ({ ...prev, calculating: true }));
        
        try {
            let occupancy = currentOccupancy;
            let householdCountValue = householdCount;

            // Fetch current occupancy if not already cached
            if (formData.distribution_type === "per_individual" && !occupancy) {
                const occupancyResult = await fetchCurrentCenterOccupancy(centerId);
                if (occupancyResult.success && occupancyResult.current_occupancy !== undefined) {
                    occupancy = occupancyResult.current_occupancy;
                    setCurrentOccupancy(occupancy);
                }
            }

            // Fetch household count if not already cached
            if (formData.distribution_type === "per_household" && !householdCountValue) {
                const householdResult = await fetchCenterHouseholdCount(centerId);
                if (householdResult.success && householdResult.household_count !== undefined) {
                    householdCountValue = householdResult.household_count;
                    setHouseholdCount(householdCountValue);
                }
            }

            // Calculate recommended quantity based on distribution type
            if (formData.distribution_type === "per_individual" && occupancy !== null) {
                setRecommendedQuantity(occupancy);
                setCalculationInfo(`${occupancy} individuals currently checked in`);
            } else if (formData.distribution_type === "per_household" && householdCountValue !== null) {
                setRecommendedQuantity(householdCountValue);
                setCalculationInfo(`${householdCountValue} households checked in`);
            } else {
                setRecommendedQuantity(null);
                setCalculationInfo("");
            }
        } catch (error) {
            console.error("Error calculating recommended quantity:", error);
            setRecommendedQuantity(null);
            setCalculationInfo("Unable to calculate recommended quantity");
        } finally {
            setLoading(prev => ({ ...prev, calculating: false }));
        }
    };

    const resetRecommendedQuantity = () => {
        setRecommendedQuantity(null);
        setCalculationInfo("");
        setCurrentOccupancy(null);
        setHouseholdCount(null);
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
                event_id: activeEvent ? activeEvent.event_id.toString() : "", // AUTO-SET WITH ACTIVE EVENT
                distribution_type: "",
                quantity: "",
            }));
            resetRecommendedQuantity();
        }
        
        // Reset quantity when distribution type changes
        if (field === "distribution_type") {
            setFormData(prev => ({ 
                ...prev, 
                quantity: "",
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

    const handleUseRecommended = () => {
        if (recommendedQuantity !== null) {
            setFormData(prev => ({ 
                ...prev, 
                quantity: recommendedQuantity.toString() 
            }));
            // Clear quantity error if it exists
            if (errors.quantity) {
                setErrors(prev => ({ ...prev, quantity: "" }));
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.center_id) newErrors.center_id = "Evacuation center is required";
        if (!formData.category_id) newErrors.category_id = "Category is required";
        if (!formData.event_id) newErrors.event_id = "Event is required";
        if (!formData.resource_name.trim()) newErrors.resource_name = "Relief type is required";
        if (!formData.distribution_type) newErrors.distribution_type = "Distribution type is required";
        if (!formData.quantity || Number(formData.quantity) <= 0) 
            newErrors.quantity = "Quantity must be greater than 0";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const payload = {
                center_id: Number(formData.center_id),
                category_id: Number(formData.category_id),
                event_id: Number(formData.event_id),
                resource_name: formData.resource_name,
                total_quantity: Number(formData.quantity),
                distribution_type: formData.distribution_type,
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
            distribution_type: "",
        });
        setErrors({});
        setActiveEvents([]);
        resetRecommendedQuantity();
        setActiveEvent(null); // RESET ACTIVE EVENT
        onClose();
    };

    // Function to prevent auto-focus
    const handleOpenAutoFocus = (event: Event) => {
        event.preventDefault();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="max-w-md max-h-[90vh] overflow-y-auto" // ADD SCROLLABLE STYLES
                onOpenAutoFocus={handleOpenAutoFocus}
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* ACTIVE EVENT DISPLAY - LIKE IN CHECKINMODAL */}
                    {activeEvent ? (
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                                        Active Event: {activeEvent.event_name}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        {activeEvent.event_type} • Declared on{" "}
                                        {new Date(activeEvent.date_declared).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        Allocation will be automatically linked to this event
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                                        No Active Event
                                    </div>
                                    <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        An event must be active to allocate aid. Please create and activate an event first.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Evacuation Center */}
                    <div className="space-y-2">
                        <Label htmlFor="center_id" className="font-semibold">
                            Active Evacuation Center
                        </Label>
                        <Select
                            value={formData.center_id}
                            onValueChange={(value) => handleChange("center_id", value)}
                            disabled={loading.centers || !activeEvent} // DISABLE IF NO ACTIVE EVENT
                        >
                            <SelectTrigger 
                                className={`w-full ${errors.center_id ? "border-destructive" : ""}`}
                                ref={firstSelectRef}
                            >
                                <SelectValue placeholder={
                                    loading.centers ? "Loading centers..." : 
                                    !activeEvent ? "No active event - cannot select center" :
                                    "Select evacuation center"
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

                    {/* Event - HIDDEN SINCE WE AUTO-SET IT */}
                    <div className="space-y-2 hidden"> {/* ADD HIDDEN CLASS */}
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
                            disabled={loading.categories || !activeEvent} // DISABLE IF NO ACTIVE EVENT
                        >
                            <SelectTrigger 
                                className={`w-full ${errors.category_id ? "border-destructive" : ""}`}
                            >
                                <SelectValue placeholder={
                                    loading.categories ? "Loading categories..." : 
                                    !activeEvent ? "No active event - cannot select category" :
                                    "Select category"
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
                            tabIndex={-1}
                            disabled={!activeEvent} // DISABLE IF NO ACTIVE EVENT
                        />
                        {errors.resource_name && (
                            <p className="text-sm text-destructive">{errors.resource_name}</p>
                        )}
                    </div>

                    {/* Distribution Type - MOVED ABOVE QUANTITY */}
                    <div className="space-y-3">
                        <Label className="font-semibold block">Distribution Type</Label>
                        {errors.distribution_type && (
                            <p className="text-sm text-destructive">{errors.distribution_type}</p>
                        )}
                        <div className="flex space-x-6">
                            <div className="flex flex-col items-center">
                                <input
                                    type="radio"
                                    id="per_individual"
                                    name="distribution_type"
                                    value="per_individual"
                                    checked={formData.distribution_type === "per_individual"}
                                    onChange={(e) => handleChange("distribution_type", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    tabIndex={-1}
                                    disabled={!formData.center_id || !activeEvent} // ADD ACTIVE EVENT CHECK
                                />
                                <Label 
                                    htmlFor="per_individual" 
                                    className="ml-2 cursor-pointer select-none mt-1 flex flex-col items-center"
                                    tabIndex={-1}
                                >
                                    <Users className="h-4 w-4 mb-1" />
                                    Per Individual
                                </Label>
                            </div>
                            <div className="flex flex-col items-center">
                                <input
                                    type="radio"
                                    id="per_household"
                                    name="distribution_type"
                                    value="per_household"
                                    checked={formData.distribution_type === "per_household"}
                                    onChange={(e) => handleChange("distribution_type", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    tabIndex={-1}
                                    disabled={!formData.center_id || !activeEvent} // ADD ACTIVE EVENT CHECK
                                />
                                <Label 
                                    htmlFor="per_household" 
                                    className="ml-2 cursor-pointer select-none mt-1 flex flex-col items-center"
                                    tabIndex={-1}
                                >
                                    <Home className="h-4 w-4 mb-1" />
                                    Per Household
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Recommended Quantity Information */}
                    {formData.distribution_type && calculationInfo && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <div className="flex items-start">
                                <Calculator className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                                <AlertDescription className="text-sm">
                                    <span className="font-medium">Recommended:</span> {calculationInfo}
                                    {recommendedQuantity !== null && (
                                        <>
                                            <br />
                                            <span className="font-semibold">Recommended Quantity: {recommendedQuantity}</span>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="ml-2 mt-1 h-6 text-xs"
                                                onClick={handleUseRecommended}
                                            >
                                                Use Recommended
                                            </Button>
                                        </>
                                    )}
                                </AlertDescription>
                            </div>
                        </Alert>
                    )}

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
                                tabIndex={-1}
                                disabled={!formData.distribution_type || !activeEvent} // ADD ACTIVE EVENT CHECK
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col border-l border-input">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('increment')}
                                    className="flex-1 flex items-center justify-center px-3 border-b border-input hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Increase quantity"
                                    tabIndex={-1}
                                    disabled={!formData.distribution_type || !activeEvent} // ADD ACTIVE EVENT CHECK
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange('decrement')}
                                    className="flex-1 flex items-center justify-center px-3 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Decrease quantity"
                                    tabIndex={-1}
                                    disabled={!formData.distribution_type || !activeEvent} // ADD ACTIVE EVENT CHECK
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading.calculating || !activeEvent} // DISABLE IF NO ACTIVE EVENT
                    >
                        {submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}