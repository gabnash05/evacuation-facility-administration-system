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
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import type { CheckOutData } from "@/types/attendance";

interface CheckOutModalProps {
    isOpen: boolean;
    recordId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function CheckOutModal({ isOpen, onClose, onSuccess, recordId }: CheckOutModalProps) {
    const { checkOutIndividual } = useAttendanceStore();

    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
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

        setIsSubmitting(true);
        setError(null);

        try {
            const checkOutData: CheckOutData = {
                notes: notes || undefined,
            };

            await checkOutIndividual(recordId, checkOutData);
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
                    <DialogTitle className="text-lg font-semibold">
                        Check Out Individual
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to check out this individual? This will mark their attendance as completed.
                        </p>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Reason for check-out or additional notes (optional)"
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
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {isSubmitting ? "Checking Out..." : "Check Out"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}