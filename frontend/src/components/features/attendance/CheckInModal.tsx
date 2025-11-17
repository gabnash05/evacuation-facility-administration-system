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
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useEventStore } from "@/store/eventStore";
import { useHouseholdStore } from "@/store/householdStore";
import { useIndividualStore } from "@/store/individualStore";
import type { CreateAttendanceData } from "@/types/attendance";
import type { Individual } from "@/types/individual";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCenterId?: number;
}

export function CheckInModal({ isOpen, onClose, onSuccess, defaultCenterId }: CheckInModalProps) {
    const { checkInIndividual } = useAttendanceStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();
    const { events, fetchEvents, loading: eventsLoading } = useEventStore();
    const { households, fetchHouseholds, loading: householdsLoading } = useHouseholdStore();
    const { individuals, fetchIndividuals, loading: individualsLoading } = useIndividualStore();

    const [individualId, setIndividualId] = useState<string>("");
    const [centerId, setCenterId] = useState<string>("");
    const [eventId, setEventId] = useState<string>("");
    const [householdId, setHouseholdId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (!defaultCenterId) {
                fetchAllCenters();
            }
            fetchEvents();
            fetchHouseholds();
            fetchIndividuals();
            
            if (defaultCenterId) {
                setCenterId(String(defaultCenterId));
            }
        }
    }, [isOpen, fetchAllCenters, fetchEvents, fetchHouseholds, fetchIndividuals, defaultCenterId]);

    const resetForm = () => {
        setIndividualId("");
        setCenterId("");
        setEventId("");
        setHouseholdId("");
        setNotes("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!individualId || !centerId || !eventId || !householdId) {
            setError("All fields are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const checkInData: CreateAttendanceData = {
                individual_id: Number(individualId),
                center_id: Number(centerId),
                event_id: Number(eventId),
                household_id: Number(householdId),
                notes: notes || undefined,
            };

            await checkInIndividual(checkInData);
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Check In Individual
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Individual *</Label>
                            <Select
                                value={individualId}
                                onValueChange={setIndividualId}
                                disabled={individualsLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            individualsLoading
                                                ? "Loading individuals..."
                                                : "Select an individual"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {individuals.map((individual: Individual) => (
                                        <SelectItem
                                            key={individual.individual_id}
                                            value={String(individual.individual_id)}
                                        >
                                            {individual.first_name} {individual.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Evacuation Center *</Label>
                            <Select
                                value={centerId}
                                onValueChange={setCenterId}
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
                                    {centers.map(center => (
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
                            <Label className="text-sm font-medium">Event *</Label>
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
                                                : "Select an event"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(event => (
                                        <SelectItem
                                            key={event.event_id}
                                            value={String(event.event_id)}
                                        >
                                            {event.event_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Household *</Label>
                            <Select
                                value={householdId}
                                onValueChange={setHouseholdId}
                                disabled={householdsLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            householdsLoading
                                                ? "Loading households..."
                                                : "Select a household"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {households.map(household => (
                                        <SelectItem
                                            key={household.household_id}
                                            value={String(household.household_id)}
                                        >
                                            {household.household_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e: any) => setNotes(e.target.value)}
                                placeholder="Additional notes (optional)"
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
                        disabled={isSubmitting || centersLoading || eventsLoading || householdsLoading || individualsLoading}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {isSubmitting ? "Checking In..." : "Check In"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}