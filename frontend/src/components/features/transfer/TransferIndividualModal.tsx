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
import { ArrowRightLeft, X, Home, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useIndividualStore } from "@/store/individualStore";
import { IndividualSearchTable } from "@/components/features/attendance/IndividualSearchTable";
import { EvacuationCentersList } from "@/components/features/transfer/EvacuationCentersList";
import { TransferReasonSelect } from "@/components/features/transfer/TransferReasonSelect";
import type { AttendanceRecord, TransferData, TransferReason } from "@/types/attendance";
import type { Individual } from "@/types/individual";

interface TransferIndividualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (transferCount?: number) => void;
    defaultCenterId?: number;
    onTransfer?: (recordId: number, data: TransferData) => Promise<void>;
    onBatchTransfer?: (data: {
        transfers: Array<{
            record_id: number;
            transfer_to_center_id: number;
            transfer_time?: string;
            recorded_by_user_id?: number;
            notes?: string;
        }>;
    }) => Promise<void>;
}

interface ProcessedIndividual {
    individual: Individual;
    record_id: number | null;
    original_center_name?: string;
    status: "ready" | "loading" | "error";
    error?: string;
}

export function TransferIndividualModal({
    isOpen,
    onClose,
    onSuccess,
    defaultCenterId,
    onTransfer,
    onBatchTransfer,
}: TransferIndividualModalProps) {
    const { 
        currentAttendees, 
        fetchCurrentAttendees,
        fetchIndividualAttendanceHistory,
        loading: attendanceLoading 
    } = useAttendanceStore();

    const [centerSearchQuery, setCenterSearchQuery] = useState("");
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();
    const { clearSearch } = useIndividualStore();
    
    const [selectedIndividuals, setSelectedIndividuals] = useState<ProcessedIndividual[]>([]);
    const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
    const [transferReason, setTransferReason] = useState<TransferReason | "">("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingRecords, setProcessingRecords] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            fetchCurrentAttendees({
                center_id: defaultCenterId,
            });
            fetchAllCenters();
        } else {
            resetForm();
        }
    }, [isOpen, defaultCenterId, fetchCurrentAttendees]);

    const resetForm = () => {
        setCenterSearchQuery("");
        setSelectedIndividuals([]);
        setSelectedCenterId(null);
        setTransferReason("");
        setNotes("");
        setError(null);
        setProcessingRecords(false);
        clearSearch();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSelectIndividual = async (individual: Individual) => {
        // Check if individual is already selected
        if (selectedIndividuals.find(ind => ind.individual.individual_id === individual.individual_id)) {
            return;
        }

        // Add individual with loading state
        const newIndividual: ProcessedIndividual = {
            individual,
            record_id: null,
            status: "loading"
        };
        
        setSelectedIndividuals(prev => [...prev, newIndividual]);
        
        // Find active record for this individual
        try {
            const history = await fetchIndividualAttendanceHistory(individual.individual_id);
            const activeRecord = (history as any[]).find(
                (record: AttendanceRecord) => record.status === "checked_in" && !record.check_out_time
            );
            
            if (activeRecord) {
                setSelectedIndividuals(prev => 
                    prev.map(ind => 
                        ind.individual.individual_id === individual.individual_id
                            ? {
                                ...ind,
                                record_id: activeRecord.record_id,
                                original_center_name: activeRecord.center_name,
                                status: "ready"
                            }
                            : ind
                    )
                );
                setError(null);
            } else {
                setSelectedIndividuals(prev => 
                    prev.map(ind => 
                        ind.individual.individual_id === individual.individual_id
                            ? {
                                ...ind,
                                status: "error",
                                error: "No active check-in record"
                            }
                            : ind
                    )
                );
            }
        } catch (err: any) {
            setSelectedIndividuals(prev => 
                prev.map(ind => 
                    ind.individual.individual_id === individual.individual_id
                        ? {
                            ...ind,
                            status: "error",
                            error: "Failed to retrieve attendance history"
                        }
                        : ind
                )
            );
        }
    };

    const handleRemoveIndividual = (individualId: number) => {
        setSelectedIndividuals(prev => 
            prev.filter(ind => ind.individual.individual_id !== individualId)
        );
    };

    const handleClearAllIndividuals = () => {
        setSelectedIndividuals([]);
    };

    const handleSubmit = async () => {
        // Validate ready individuals
        const readyIndividuals = selectedIndividuals.filter(ind => ind.status === "ready");
        const readyCount = readyIndividuals.length;
        
        if (readyCount === 0) {
            setError("No individuals ready for transfer. Please select individuals with active check-in records.");
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
            if (readyCount === 1) {
                // Single transfer
                const individual = readyIndividuals[0];
                if (!individual.record_id) {
                    throw new Error("No active record found");
                }

                const transferData: TransferData = {
                    transfer_to_center_id: selectedCenterId!,
                    notes: `${transferReason}. ${notes || ""}`.trim(),
                };

                if (typeof onTransfer === "function") {
                    await onTransfer(individual.record_id, transferData);
                } else {
                    // fallback to store action if parent didn't provide handler
                    await (useAttendanceStore.getState().transferIndividual as any)(
                        individual.record_id,
                        transferData
                    );
                }
                
                onSuccess(1);
            } else {
                // Batch transfer
                const transferData = {
                    transfers: readyIndividuals.map(ind => ({
                        record_id: ind.record_id!,
                        transfer_to_center_id: selectedCenterId!,
                        notes: `${transferReason}. ${notes || ""}`.trim(),
                    }))
                };

                if (typeof onBatchTransfer === "function") {
                    await onBatchTransfer(transferData);
                } else {
                    // fallback to store action if parent didn't provide handler
                    await (useAttendanceStore.getState().transferMultipleIndividuals as any)(
                        transferData
                    );
                }
                
                onSuccess(readyCount);
            }

            resetForm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transfer individual(s)");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSubmitButtonText = () => {
        const readyCount = selectedIndividuals.filter(ind => ind.status === "ready").length;
        
        if (isSubmitting) {
            return readyCount === 1 
                ? "Transferring..." 
                : `Transferring ${readyCount} Individuals...`;
        }
        
        return readyCount === 1 
            ? "✓ Confirm Transfer" 
            : `✓ Transfer ${readyCount} Individuals`;
    };

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

    const readyCount = selectedIndividuals.filter(ind => ind.status === "ready").length;
    const errorCount = selectedIndividuals.filter(ind => ind.status === "error").length;
    const loadingCount = selectedIndividuals.filter(ind => ind.status === "loading").length;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        {selectedIndividuals.length > 1 ? "Transfer Individuals" : "Transfer Individual"}
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
                                <div>
                                    <Label className="text-base font-semibold">
                                        Selected Individuals ({selectedIndividuals.length})
                                    </Label>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="text-green-600">
                                            ✓ {readyCount} ready
                                        </span>
                                        {loadingCount > 0 && (
                                            <span className="text-yellow-600">
                                                ⏳ {loadingCount} loading
                                            </span>
                                        )}
                                        {errorCount > 0 && (
                                            <span className="text-red-600">
                                                ✗ {errorCount} error
                                            </span>
                                        )}
                                    </div>
                                </div>
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
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {selectedIndividuals.map((processedIndividual) => (
                                    <div
                                        key={processedIndividual.individual.individual_id}
                                        className={`flex justify-between items-center p-3 rounded-lg border ${
                                            processedIndividual.status === "ready"
                                                ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                                : processedIndividual.status === "error"
                                                ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                                : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {processedIndividual.individual.first_name} {processedIndividual.individual.last_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                ID: {processedIndividual.individual.individual_id}
                                            </div>
                                            
                                            {processedIndividual.status === "ready" && (
                                                <div className="mt-1">
                                                    <div className="text-sm">
                                                        From: {processedIndividual.original_center_name || "Unknown Center"}
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${getStatusColor("checked_in")} mt-1`}
                                                    >
                                                        ✓ Ready to transfer (Record #{processedIndividual.record_id})
                                                    </Badge>
                                                </div>
                                            )}
                                            
                                            {processedIndividual.status === "loading" && (
                                                <div className="text-sm text-yellow-600 mt-1">
                                                    ⏳ Finding active check-in record...
                                                </div>
                                            )}
                                            
                                            {processedIndividual.status === "error" && (
                                                <div className="text-sm text-red-600 mt-1">
                                                    ✗ {processedIndividual.error}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveIndividual(processedIndividual.individual.individual_id)}
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
                        <Label className="text-base font-semibold">
                            Search and Select Individuals to Transfer *
                        </Label>

                        <IndividualSearchTable
                            onSelectIndividual={handleSelectIndividual}
                            selectedIndividuals={selectedIndividuals.map(ind => ind.individual)}
                        />

                        <div className="text-sm text-muted-foreground">
                            Note: Only individuals with active check-in records can be transferred
                        </div>
                    </div>

                    {/* Transfer Destination */}
                    <div className="space-y-4 border-b pb-6">
                        <Label className="text-base font-semibold">
                            Select Destination Center *
                        </Label>
                        
                        <Input
                            type="text"
                            placeholder="Search centers..."
                            value={centerSearchQuery}
                            onChange={e => setCenterSearchQuery(e.target.value)}
                            className="w-full"
                        />
                        
                        <EvacuationCentersList
                            centers={centers}
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
                        disabled={readyCount === 0 || !selectedCenterId || !transferReason || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 px-6"
                    >
                        {getSubmitButtonText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}