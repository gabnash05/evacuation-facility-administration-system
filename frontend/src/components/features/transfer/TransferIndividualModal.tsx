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
import { ArrowRightLeft, X, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IndividualSearchTable } from "@/components/features/attendance/IndividualSearchTable";
import { TransferDestinationTabs } from "@/components/features/transfer/TransferDestinationTabs";
import { TransferReasonSelect } from "@/components/features/transfer/TransferReasonSelect";
import { TransferService } from "@/services/transferService";
import { validateTransferForm } from "@/schemas/transfer";
import type { Individual } from "@/types/individual";
import type { TransferReason, TransferDestinationType } from "@/types/transfer";

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
    const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
    const [destinationType, setDestinationType] = useState<TransferDestinationType>("center");
    const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
    const [transferReason, setTransferReason] = useState<TransferReason | "">("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSelectedIndividual(null);
        setDestinationType("center");
        setSelectedCenterId(null);
        setSelectedHouseholdId(null);
        setSelectedHospitalId(null);
        setTransferReason("");
        setNotes("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSelectIndividual = (individual: Individual) => {
        setSelectedIndividual(individual);
    };

    const handleRemoveIndividual = () => {
        setSelectedIndividual(null);
    };

    const handleDestinationSelect = (id: number | null) => {
        if (destinationType === "center") {
            setSelectedCenterId(id);
        } else if (destinationType === "home") {
            setSelectedHouseholdId(id);
        } else if (destinationType === "hospital") {
            setSelectedHospitalId(id);
        }
    };

    const getSelectedDestinationId = () => {
        switch (destinationType) {
            case "center":
                return selectedCenterId;
            case "home":
                return selectedHouseholdId;
            case "hospital":
                return selectedHospitalId;
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        if (!selectedIndividual) {
            setError("Please select an individual to transfer");
            return;
        }

        // Validate form
        const validation = validateTransferForm({
            individual_ids: [selectedIndividual.individual_id],
            destination_type: destinationType,
            destination_center_id: destinationType === "center" ? selectedCenterId : undefined,
            reason: transferReason,
            notes: notes || undefined,
        });

        if (!validation.success && validation.errors) {
            const errorMessages = Object.values(validation.errors).flat().join(", ");
            setError(errorMessages);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await TransferService.transferIndividuals({
                individual_ids: [selectedIndividual.individual_id],
                destination_type: destinationType,
                destination_center_id: selectedCenterId || undefined,
                reason: transferReason as TransferReason,
                notes: notes || undefined,
            });

            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transfer individual");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        selectedIndividual &&
        transferReason &&
        (destinationType !== "center" || selectedCenterId !== null);

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
                    {selectedIndividual && (
                        <div className="space-y-3 border-b pb-6">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">Selected Individual</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveIndividual}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {selectedIndividual.first_name} {selectedIndividual.last_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        ID: {selectedIndividual.individual_id} •
                                        {selectedIndividual.gender && ` ${selectedIndividual.gender} •`}
                                        {selectedIndividual.date_of_birth &&
                                            ` DOB: ${new Date(selectedIndividual.date_of_birth).toLocaleDateString()}`}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-sm">
                                        <Home className="h-3 w-3" />
                                        Household ID: {selectedIndividual.household_id}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Individual Search and Selection */}
                    {!selectedIndividual && (
                        <div className="space-y-4 border-b pb-6">
                            <Label className="text-base font-semibold">
                                Search and Select Individual *
                            </Label>
                            <IndividualSearchTable
                                onSelectIndividual={handleSelectIndividual}
                                selectedIndividuals={selectedIndividual ? [selectedIndividual] : []}
                            />
                        </div>
                    )}

                    {/* Transfer Destination Section */}
                    <div className="space-y-4 border-b pb-6">
                        <Label className="text-base font-semibold">
                            Select Transfer Destination *
                        </Label>
                        <TransferDestinationTabs
                            activeTab={destinationType}
                            onTabChange={(tab) => {
                                setDestinationType(tab);
                                setSelectedCenterId(null);
                                setSelectedHouseholdId(null);
                                setSelectedHospitalId(null);
                            }}
                            selectedCenterId={getSelectedDestinationId()}
                            onCenterSelect={handleDestinationSelect}
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