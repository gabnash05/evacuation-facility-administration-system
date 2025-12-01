// components/attendance/CheckInModal.tsx
import { useState, useEffect } from "react";
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
import { useIndividualStore } from "@/store/individualStore";
import { IndividualSearchTable } from "./IndividualSearchTable";
import type { CreateAttendanceData } from "@/types/attendance";
import type { Individual } from "@/types/individual";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCenterId?: number;
}

export function CheckInModal({ isOpen, onClose, onSuccess, defaultCenterId }: CheckInModalProps) {
    const { checkInMultipleIndividuals } = useAttendanceStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();
    const { events, fetchEvents, loading: eventsLoading } = useEventStore();
    const { clearSearch } = useIndividualStore();

    const [selectedIndividuals, setSelectedIndividuals] = useState<Individual[]>([]);
    const [centerId, setCenterId] = useState<string>("");
    const [eventId, setEventId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const safeCenters = centers || [];
    const safeEvents = events || [];
    const filteredEvents = safeEvents.filter(event => event?.status === "active");

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
        } else {
            // Clear search and selections when modal closes
            clearSearch();
            setSelectedIndividuals([]);
            setEventId("");
            setNotes("");
            setError(null);
        }
    }, [isOpen, fetchAllCenters, fetchEvents, defaultCenterId, clearSearch]);

    const resetForm = () => {
        setSelectedIndividuals([]);
        setCenterId(defaultCenterId ? String(defaultCenterId) : "");
        setEventId("");
        setNotes("");
        setError(null);
        clearSearch();
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
            resetForm(); // Reset form after successful submission
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
                            />
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