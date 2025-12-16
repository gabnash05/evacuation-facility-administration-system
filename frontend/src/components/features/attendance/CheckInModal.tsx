// components/attendance/CheckInModal.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Home, Calendar, X, AlertCircle } from "lucide-react";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useEventStore } from "@/store/eventStore";
import { IndividualSearchTable } from "./IndividualSearchTable";
import type { CreateAttendanceData } from "@/types/attendance";
import type { Individual } from "@/types/individual";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCenterId?: number;
    individualToCheckIn?: any;
}

export function CheckInModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    defaultCenterId,
    individualToCheckIn
}: CheckInModalProps) {
    const { 
        checkInMultipleIndividuals, 
        validateAttendanceConditions,
        attendanceValidation 
    } = useAttendanceStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();
    const { activeEvent, fetchActiveEvent, loading: eventsLoading } = useEventStore();

    const [selectedIndividuals, setSelectedIndividuals] = useState<Individual[]>([]);
    const [centerId, setCenterId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    // ADD LOCAL STATE FOR MODAL SEARCH
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [modalPage, setModalPage] = useState(1);
    const [modalSearchResults, setModalSearchResults] = useState<Individual[]>([]);
    const [modalTotalRecords, setModalTotalRecords] = useState(0);
    const [modalSearchLoading, setModalSearchLoading] = useState(false);

    const safeCenters = centers || [];
    // Filter only active centers
    const activeCenters = safeCenters.filter(center => center.status === "active");

    // Use refs for debounce timeout
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch active event when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchActiveEvent();
            if (!defaultCenterId) {
                fetchAllCenters();
            }
        }
    }, [isOpen, fetchActiveEvent, fetchAllCenters, defaultCenterId]);

    // Validate attendance conditions when center is selected
    useEffect(() => {
        if (isOpen && centerId) {
            const validateCenter = async () => {
                try {
                    const validation = await validateAttendanceConditions(Number(centerId));
                    if (!validation.canTakeAttendance) {
                        setValidationError(validation.message || "Cannot take attendance at this center");
                    } else {
                        setValidationError(null);
                    }
                } catch (err) {
                    setValidationError("Failed to validate attendance conditions");
                }
            };
            validateCenter();
        }
    }, [isOpen, centerId, validateAttendanceConditions]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (defaultCenterId) {
                setCenterId(String(defaultCenterId));
            } else {
                setCenterId("");
            }
            
            // Reset other fields
            setNotes("");
            setSelectedIndividuals([]);
            setError(null);
            setValidationError(null);
            
            // Reset modal search state
            setModalSearchQuery("");
            setModalPage(1);
            setModalSearchResults([]);
            setModalTotalRecords(0);

            // Pre-select individual if provided
            if (individualToCheckIn) {
                const individual: Individual = {
                    individual_id: individualToCheckIn.individual_id,
                    first_name: individualToCheckIn.first_name,
                    last_name: individualToCheckIn.last_name,
                    date_of_birth: individualToCheckIn.date_of_birth,
                    gender: individualToCheckIn.gender,
                    relationship_to_head: individualToCheckIn.relationship_to_head,
                    household_id: individualToCheckIn.household_id,
                    current_status: individualToCheckIn.current_status,
                    created_at: individualToCheckIn.created_at,
                    updated_at: individualToCheckIn.updated_at,
                };
                setSelectedIndividuals([individual]);
            }
        } else {
            setSelectedIndividuals([]);
            setNotes("");
            setError(null);
            setValidationError(null);
            setModalSearchQuery("");
            setModalPage(1);
            setModalSearchResults([]);
            setModalTotalRecords(0);
            
            // Clear any pending search timeout
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
        }
    }, [isOpen, defaultCenterId, individualToCheckIn]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const resetForm = () => {
        setSelectedIndividuals([]);
        setCenterId(defaultCenterId ? String(defaultCenterId) : "");
        setNotes("");
        setError(null);
        setValidationError(null);
        setModalSearchQuery("");
        setModalPage(1);
        setModalSearchResults([]);
        setModalTotalRecords(0);
        
        // Clear timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        // Validation checks
        if (selectedIndividuals.length === 0) {
            setError("Please select at least one individual.");
            return;
        }

        if (!centerId) {
            setError("Please select an evacuation center.");
            return;
        }

        if (!activeEvent) {
            setError("No active event found. An event must be active to take attendance.");
            return;
        }

        // Check if all selected individuals have household_id
        const individualsWithoutHousehold = selectedIndividuals.filter(
            individual => !individual.household_id
        );
        if (individualsWithoutHousehold.length > 0) {
            setError("Some selected individuals do not belong to a household.");
            return;
        }

        // Check validation
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Use the active event's ID automatically
            const checkInData: CreateAttendanceData[] = selectedIndividuals.map(individual => ({
                individual_id: individual.individual_id,
                center_id: Number(centerId),
                event_id: activeEvent.event_id, // Automatically use active event
                household_id: individual.household_id!,
                notes: notes || undefined,
            }));

            const result = await checkInMultipleIndividuals(checkInData);
            
            if (result.success) {
                onSuccess();
                resetForm();
                onClose();
            } else {
                setError(result.message || "Failed to check in individuals");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during check-in");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIndividualSelect = (individual: Individual) => {
        // Check if individual is already selected
        if (!selectedIndividuals.find(ind => ind.individual_id === individual.individual_id)) {
            setSelectedIndividuals(prev => [...prev, individual]);
        }
    };

    const handleRemoveIndividual = (individualId: number) => {
        setSelectedIndividuals(prev => prev.filter(ind => ind.individual_id !== individualId));
    };

    const handleClearAllIndividuals = () => {
        setSelectedIndividuals([]);
    };

    const handleCenterChange = (value: string) => {
        setCenterId(value);
        setValidationError(null); // Clear validation error when changing center
    };

    // ACTUAL SEARCH FUNCTION
    const performSearch = useCallback(async (search: string, page: number) => {
        setModalSearchLoading(true);
        try {
            const { IndividualService } = await import("@/services/individualService");
            
            const response = await IndividualService.getIndividuals({
                search: search,
                page: page,
                limit: 10,
                sortBy: "last_name",
                sortOrder: "asc",
            });
            
            console.log("Performing modal search with:", { search, page });
            console.log("Modal search response:", response);

            if (response.success && response.data) {
                setModalSearchResults(response.data.results || []);
                setModalTotalRecords(response.data.pagination?.total_items || 0);
            } else {
                throw new Error(response.message || "Search failed");
            }
        } catch (error) {
            console.error("Modal search failed:", error);
            setModalSearchResults([]);
            setModalTotalRecords(0);
        } finally {
            setModalSearchLoading(false);
        }
    }, []);

    const handleModalSearch = async (params: {
        search: string;
        page: number;
        limit: number;
    }): Promise<{ success: boolean; data: Individual[]; totalRecords: number }> => {
        console.log("handleModalSearch called with:", params);
        
        if (modalSearchQuery === params.search && modalPage === params.page) {
            return {
                success: true,
                data: modalSearchResults,
                totalRecords: modalTotalRecords
            };
        }
        
        setModalSearchQuery(params.search);
        setModalPage(params.page);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (params.search.trim() === "") {
            setModalSearchResults([]);
            setModalTotalRecords(0);
            return {
                success: true,
                data: [],
                totalRecords: 0
            };
        }
        
        return new Promise<{ success: boolean; data: Individual[]; totalRecords: number }>((resolve) => {
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const { IndividualService } = await import("@/services/individualService");
                    const response = await IndividualService.getIndividuals({
                        search: params.search,
                        page: params.page,
                        limit: params.limit,
                        sortBy: "last_name",
                        sortOrder: "asc",
                    });
                    
                    if (response.success && response.data) {
                        const results = response.data.results || [];
                        const total = response.data.pagination?.total_items || 0;
                        
                        setModalSearchResults(results);
                        setModalTotalRecords(total);
                        resolve({
                            success: true,
                            data: results,
                            totalRecords: total
                        });
                    } else {
                        resolve({
                            success: false,
                            data: [],
                            totalRecords: 0
                        });
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                    resolve({
                        success: false,
                        data: [],
                        totalRecords: 0
                    });
                }
            }, 500);
        });
    };

    const handleModalPageChange = (page: number) => {
        setModalPage(page);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        if (modalSearchQuery.trim() === "") {
            setModalSearchResults([]);
            setModalTotalRecords(0);
        } else {
            performSearch(modalSearchQuery, page);
        }
    };

    // Check if we can take attendance
    const canTakeAttendance = !validationError && activeEvent && centerId && activeCenters.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Check In Individuals
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Active Event Display */}
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
                                        Attendance will be automatically linked to this event
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
                                        An event must be active to take attendance. Please create and activate an event first.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Center Status Validation */}
                    {validationError && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>{validationError}</div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Selected Individuals Display */}
                    {selectedIndividuals.length > 0 && (
                        <div className="space-y-3 border-b pb-6">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">
                                    Selected Individuals ({selectedIndividuals.length})
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAllIndividuals}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedIndividuals.map(individual => (
                                    <div
                                        key={individual.individual_id}
                                        className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {individual.first_name} {individual.last_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                ID: {individual.individual_id} •
                                                {individual.gender && ` ${individual.gender} •`}
                                                {individual.date_of_birth &&
                                                    ` DOB: ${new Date(individual.date_of_birth).toLocaleDateString()}`}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 text-sm">
                                                <Home className="h-3 w-3" />
                                                Household ID: {individual.household_id}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveIndividual(individual.individual_id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Search and Selection */}
                    <div className="space-y-4 border-b pb-6">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Search and Select Individuals *
                        </Label>

                        <IndividualSearchTable
                            onSelectIndividual={handleIndividualSelect}
                            selectedIndividuals={selectedIndividuals}
                            onSearch={handleModalSearch}
                            modalPage={modalPage}
                            onModalPageChange={handleModalPageChange}
                            isLoading={modalSearchLoading}
                            errorMessage={''}
                        />
                    </div>

                    {/* Secondary Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Evacuation Center *
                            </Label>
                            <Select
                                value={centerId}
                                onValueChange={handleCenterChange}
                                disabled={!!defaultCenterId || centersLoading || !activeEvent}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            centersLoading
                                                ? "Loading centers..."
                                                : !activeEvent
                                                ? "No active event - cannot select center"
                                                : activeCenters.length === 0
                                                ? "No active centers available"
                                                : "Select a center"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeCenters.map(center => (
                                        <SelectItem
                                            key={center.center_id}
                                            value={String(center.center_id)}
                                        >
                                            {center.center_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {activeCenters.length === 0 && !centersLoading && activeEvent && (
                                <p className="text-sm text-muted-foreground">
                                    No active centers available. Centers must be active to take attendance.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Additional notes (optional) - will apply to all selected individuals"
                                className="w-full min-h-[80px]"
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground">
                                {notes.length}/100 characters
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            selectedIndividuals.length === 0 ||
                            !centerId ||
                            !canTakeAttendance ||
                            centersLoading ||
                            eventsLoading
                        }
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {isSubmitting 
                            ? `Checking In ${selectedIndividuals.length} Individual${selectedIndividuals.length !== 1 ? 's' : ''}...` 
                            : `Check In ${selectedIndividuals.length} Individual${selectedIndividuals.length !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}