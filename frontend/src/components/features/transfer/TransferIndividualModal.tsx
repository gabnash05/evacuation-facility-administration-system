// components/features/transfer/TransferIndividualModal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, X, Home, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { EvacuationCentersList } from "@/components/features/transfer/EvacuationCentersList";
import { TransferReasonSelect } from "@/components/features/transfer/TransferReasonSelect";
import type { AttendanceRecord, TransferData, TransferReason } from "@/types/attendance";

interface TransferIndividualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCenterId?: number;
}

export function TransferIndividualModal({
    isOpen,
    onClose,
    onSuccess,
    defaultCenterId,
}: TransferIndividualModalProps) {
    const { 
        currentAttendees, 
        fetchCurrentAttendees, 
        transferIndividual,
        loading: attendanceLoading 
    } = useAttendanceStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [centerSearchQuery, setCenterSearchQuery] = useState("");
    const [selectedAttendee, setSelectedAttendee] = useState<AttendanceRecord | null>(null);
    const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
    const [transferReason, setTransferReason] = useState<TransferReason | "">("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch current attendees when modal opens or search changes
    useEffect(() => {
        if (isOpen) {
            fetchCurrentAttendees({
                center_id: defaultCenterId,
                search: debouncedSearch,
            });
        } else {
            resetForm();
        }
    }, [isOpen, debouncedSearch, defaultCenterId, fetchCurrentAttendees]);

    const resetForm = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setCenterSearchQuery("");
        setSelectedAttendee(null);
        setSelectedCenterId(null);
        setTransferReason("");
        setNotes("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSelectAttendee = (attendee: AttendanceRecord) => {
        setSelectedAttendee(attendee);
    };

    const handleRemoveAttendee = () => {
        setSelectedAttendee(null);
    };

    const handleSubmit = async () => {
        if (!selectedAttendee) {
            setError("Please select an individual to transfer");
            return;
        }

        if (!selectedCenterId) {
            setError("Please select a destination center");
            return;
        }

        if (!transferReason) {
            setError("Please select a reason for transfer");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const transferData: TransferData = {
                transfer_to_center_id: selectedCenterId!,
                notes: notes || undefined,
            };

            await transferIndividual(selectedAttendee.record_id, transferData);
            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transfer individual");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        selectedAttendee &&
        transferReason &&
        selectedCenterId !== null;

    // Filter attendees based on search
    const filteredAttendees = currentAttendees.filter(attendee => {
        if (!debouncedSearch) return true;
        const searchLower = debouncedSearch.toLowerCase();
        return (
            attendee.individual_name?.toLowerCase().includes(searchLower) ||
            attendee.household_name?.toLowerCase().includes(searchLower) ||
            attendee.individual_id.toString().includes(searchLower)
        );
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "checked_in":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            case "checked_out":
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
            case "transferred":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Transfer Individual
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Selected Individual Display */}
                    {selectedAttendee && (
                        <div className="space-y-3 border-b pb-6">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">Selected Individual</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAttendee}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {selectedAttendee.individual_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        ID: {selectedAttendee.individual_id} •
                                        {selectedAttendee.gender && ` ${selectedAttendee.gender} •`}
                                        Current: {selectedAttendee.center_name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-sm">
                                            <Home className="h-3 w-3" />
                                            {selectedAttendee.household_name}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={getStatusColor(selectedAttendee.status)}
                                        >
                                            {selectedAttendee.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Individual Search and Selection */}
                    {!selectedAttendee && (
                        <div className="space-y-4 border-b pb-6">
                            <Label className="text-base font-semibold">
                                Search and Select Individual *
                            </Label>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, household, or ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9"
                                />
                                {attendanceLoading && searchQuery !== debouncedSearch && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </div>

                            {/* Attendees List */}
                            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                {attendanceLoading ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                        Loading checked-in individuals...
                                    </div>
                                ) : filteredAttendees.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {debouncedSearch
                                            ? "No checked-in individuals match your search"
                                            : "No individuals currently checked in"}
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredAttendees.map(attendee => (
                                            <div
                                                key={attendee.record_id}
                                                className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => handleSelectAttendee(attendee)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {attendee.individual_name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Household: {attendee.household_name} •
                                                            Current: {attendee.center_name}
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={getStatusColor(attendee.status)}
                                                    >
                                                        {attendee.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transfer Destination */}
                    <div className="space-y-4 border-b pb-6">
                        <Label className="text-base font-semibold">
                            Select Destination Center *
                        </Label>
                        
                        {/* Search Bar for Centers */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search centers..."
                                value={centerSearchQuery}
                                onChange={e => setCenterSearchQuery(e.target.value)}
                                className="w-full pl-9"
                            />
                        </div>
                        
                        <EvacuationCentersList
                            selectedCenterId={selectedCenterId}
                            onCenterSelect={setSelectedCenterId}
                            searchQuery={centerSearchQuery}
                        />
                    </div>

                    {/* Reason for Transfer */}
                    <div className="space-y-4 border-b pb-6">
                        <Label className="text-base font-semibold">Reason For Transfer *</Label>
                        <TransferReasonSelect
                            value={transferReason}
                            onChange={val => setTransferReason(val as TransferReason | "")}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Additional Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Additional notes (optional)"
                            className="w-full min-h-[80px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">{notes.length}/500 characters</p>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 px-6"
                    >
                        {isSubmitting ? "Transferring..." : "✓ Confirm Transfer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}