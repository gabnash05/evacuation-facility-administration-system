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
import { User, Home, Calendar, X } from "lucide-react";
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
    const { checkInMultipleIndividuals } = useAttendanceStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();
    const { events, fetchEvents, loading: eventsLoading } = useEventStore();

    const [selectedIndividuals, setSelectedIndividuals] = useState<Individual[]>([]);
    const [centerId, setCenterId] = useState<string>("");
    const [eventId, setEventId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ADD LOCAL STATE FOR MODAL SEARCH
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [modalPage, setModalPage] = useState(1);
    const [modalSearchResults, setModalSearchResults] = useState<Individual[]>([]);
    const [modalTotalRecords, setModalTotalRecords] = useState(0);
    const [modalSearchLoading, setModalSearchLoading] = useState(false);

    const safeCenters = centers || [];
    const safeEvents = events || [];
    const filteredEvents = safeEvents.filter(event => event?.status === "active");

    // Use refs for debounce timeout
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (!defaultCenterId) {
                fetchAllCenters();
            }
            fetchEvents();

            if (defaultCenterId) {
                setCenterId(String(defaultCenterId));
            } else {
                setCenterId("");
            }
            
            // Reset other fields
            setEventId("");
            setNotes("");
            setSelectedIndividuals([]);
            setError(null);
            
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
            setEventId("");
            setNotes("");
            setError(null);
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
    }, [isOpen, fetchAllCenters, fetchEvents, defaultCenterId, individualToCheckIn]);

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
        setEventId("");
        setNotes("");
        setError(null);
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
        if (selectedIndividuals.length === 0 || !centerId || !eventId) {
            setError("At least one individual, Evacuation Center, and Event are required.");
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

        setIsSubmitting(true);
        setError(null);

        try {
            const checkInData: CreateAttendanceData[] = selectedIndividuals.map(individual => ({
                individual_id: individual.individual_id,
                center_id: Number(centerId),
                event_id: Number(eventId),
                household_id: individual.household_id!,
                notes: notes || undefined,
            }));

            await checkInMultipleIndividuals(checkInData);
            onSuccess();
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err.message);
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
    };

    // ACTUAL SEARCH FUNCTION
    const performSearch = useCallback(async (search: string, page: number) => {
        setModalSearchLoading(true);
        try {
            // Import the service directly instead of using the store
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

    // REMOVED: Unused debouncedSearch function

    // FIXED: Properly typed handleModalSearch function
    const handleModalSearch = async (params: {
        search: string;
        page: number;
        limit: number;
    }): Promise<{ success: boolean; data: Individual[]; totalRecords: number }> => {
        console.log("handleModalSearch called with:", params);
        
        // Don't update state if nothing changed
        if (modalSearchQuery === params.search && modalPage === params.page) {
            return {
                success: true,
                data: modalSearchResults,
                totalRecords: modalTotalRecords
            };
        }
        
        // Update local state
        setModalSearchQuery(params.search);
        setModalPage(params.page);
        
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // If search is empty, clear results immediately
        if (params.search.trim() === "") {
            setModalSearchResults([]);
            setModalTotalRecords(0);
            return {
                success: true,
                data: [],
                totalRecords: 0
            };
        }
        
        // Return a promise that resolves with the search results
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


    // HANDLE PAGE CHANGE SEPARATELY (no debounce needed for page changes)
    const handleModalPageChange = (page: number) => {
        setModalPage(page);
        
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        // Immediate search for page change
        if (modalSearchQuery.trim() === "") {
            setModalSearchResults([]);
            setModalTotalRecords(0);
        } else {
            performSearch(modalSearchQuery, page);
        }
    };

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
                            // Modal provides a custom search function. Let the table manage its own input state
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
                                disabled={!!defaultCenterId || centersLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            centersLoading
                                                ? "Loading centers..."
                                                : "Select a center"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeCenters.map(center => (
                                        <SelectItem
                                            key={center.center_id}
                                            value={String(center.center_id)}
                                        >
                                            {center.center_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Event *
                            </Label>
                            <Select
                                value={eventId}
                                onValueChange={setEventId}
                                disabled={eventsLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            eventsLoading
                                                ? "Loading events..."
                                                : filteredEvents.length === 0
                                                  ? "No active events available"
                                                  : "Select an event"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredEvents.map(event => (
                                        <SelectItem
                                            key={event.event_id}
                                            value={String(event.event_id)}
                                        >
                                            <div className="flex flex-col">
                                                <span>{event.event_name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {event.event_type} •{" "}
                                                    {new Date(
                                                        event.date_declared
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {filteredEvents.length === 0 && !eventsLoading && (
                                <p className="text-sm text-muted-foreground">
                                    No active events available. Please create an event first.
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
                            !eventId ||
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