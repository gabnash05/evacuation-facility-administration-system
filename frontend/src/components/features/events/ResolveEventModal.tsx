// components/features/events/ResolveEventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/store/eventStore";
import type { Event } from "@/types/event";

interface ResolveEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export function ResolveEventModal({
    isOpen,
    onClose,
    event,
}: ResolveEventModalProps) {
    const [end_date, setEndDate] = useState<Date | undefined>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { resolveEvent, loading: storeLoading } = useEventStore();

    useEffect(() => {
        if (event && isOpen) {
            // Set end date to today by default
            setEndDate(new Date());
            setError(null);
        }
    }, [event, isOpen]);

    const handleReset = () => {
        setEndDate(new Date());
        setError(null);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleResolveEvent = async () => {
        if (!event || !end_date) {
            setError("End date is required");
            return;
        }

        // Validate end date is not earlier than event date
        const eventDate = new Date(event.date_declared);
        if (end_date < eventDate) {
            setError("End date cannot be earlier than the event start date");
            return;
        }

        // Format date as YYYY-MM-DD for backend
        const formatForBackend = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await resolveEvent(event.event_id, formatForBackend(end_date));

            if (result.success) {
                handleClose();
            } else {
                setError(result.message || "Failed to resolve event");
            }
        } catch (err: any) {
            setError(err.message || "Failed to resolve event. Please try again.");
            console.error("Resolve event error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isSubmitting || storeLoading;
    const isFormValid = end_date !== undefined;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Resolve Event
                    </DialogTitle>
                </DialogHeader>

                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Event Info */}
                {event && (
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium mb-1">Event Name</p>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {event.event_name}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium mb-1">Event Type</p>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {event.event_type}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-1">Start Date</p>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {format(new Date(event.date_declared), "dd/MM/yyyy")}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date *</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !end_date && "text-muted-foreground"
                                        )}
                                        disabled={isLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {end_date
                                            ? format(end_date, "dd/MM/yyyy")
                                            : "Select end date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={end_date}
                                        onSelect={setEndDate}
                                        disabled={date => date > new Date() || date < new Date(event.date_declared)}
                                        captionLayout="dropdown-years"
                                        fromDate={new Date(event.date_declared)}
                                        toDate={new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">
                                Marking an event as resolved will:
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Change the event status to "Resolved"</li>
                                    <li>Set the evacuation centers to inactive</li>
                                    <li>Close attendance for this event</li>
                                    <li>Allow creating new events</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Button */}
                <div className="flex justify-end pt-4 border-t gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResolveEvent}
                        className="gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium"
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Resolving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                Resolve Event
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}