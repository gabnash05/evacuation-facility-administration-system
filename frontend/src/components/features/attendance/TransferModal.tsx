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
import type { TransferData } from "@/types/attendance";

interface TransferModalProps {
    isOpen: boolean;
    recordId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, onSuccess, recordId }: TransferModalProps) {
    const { transferIndividual } = useAttendanceStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();

    const [transferToCenterId, setTransferToCenterId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAllCenters();
            resetForm();
        }
    }, [isOpen, fetchAllCenters]);

    const resetForm = () => {
        setTransferToCenterId("");
        setNotes("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!recordId) {
            setError("No attendance record selected.");
            return;
        }

        if (!transferToCenterId) {
            setError("Please select a destination center.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const transferData: TransferData = {
                transfer_to_center_id: Number(transferToCenterId),
                notes: notes || undefined,
            };

            await transferIndividual(recordId, transferData);
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
            <DialogContent className="!max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Transfer Individual</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Transfer this individual to a different evacuation center.
                        </p>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Destination Center *</Label>
                            <Select
                                value={transferToCenterId}
                                onValueChange={setTransferToCenterId}
                                disabled={centersLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            centersLoading
                                                ? "Loading centers..."
                                                : "Select destination center"
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
                            <Label className="text-sm font-medium">Transfer Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Reason for transfer or additional notes (optional)"
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
                        disabled={isSubmitting || centersLoading}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {isSubmitting ? "Transferring..." : "Transfer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
