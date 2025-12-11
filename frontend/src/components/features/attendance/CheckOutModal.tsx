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
import { Textarea } from "@/components/ui/textarea";
import { X, Home } from "lucide-react";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { IndividualSearchTable } from "@/components/features/attendance/IndividualSearchTable";
import type { Individual } from "@/types/individual";
import type { CheckOutData } from "@/types/attendance";

interface CheckOutModalProps {
    isOpen: boolean;
    recordId: number | null;
    onClose: () => void;
    onSuccess: (checkoutCount?: number) => void;
    onCheckOut?: (recordId: number, data: CheckOutData) => Promise<void>;
    onBatchCheckOut?: (data: Array<{
        record_id: number;
        notes?: string;
    }>) => Promise<void>;
    defaultCenterId?: number;
}

export function CheckOutModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    recordId, 
    onCheckOut, 
    onBatchCheckOut,
    defaultCenterId
}: CheckOutModalProps) {
    const { checkOutIndividual, checkOutMultipleIndividuals, fetchIndividualAttendanceHistory } = useAttendanceStore();
    const { centers, fetchAllCenters } = useEvacuationCenterStore();

    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIndividuals, setSelectedIndividuals] = useState<Individual[]>([]);
    const [resolvedRecords, setResolvedRecords] = useState<Array<{individual: Individual, record_id: number, center_id?: number}>>([]);
    const [findingRecords, setFindingRecords] = useState(false);
    
    // ADD LOCAL STATE FOR MODAL SEARCH (same as CheckInModal)
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [modalPage, setModalPage] = useState(1);
    const [modalSearchResults, setModalSearchResults] = useState<Individual[]>([]);
    const [modalTotalRecords, setModalTotalRecords] = useState(0);
    const [modalSearchLoading, setModalSearchLoading] = useState(false);
    
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset form when modal opens/closes & load centers for name lookups
    useEffect(() => {
        if (isOpen) {
            resetForm();
            fetchAllCenters();
        } else {
            setSelectedIndividuals([]);
            setResolvedRecords([]);
            setFindingRecords(false);
            
            // Reset modal search state
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
    }, [isOpen, fetchAllCenters]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const resetForm = () => {
        setNotes("");
        setError(null);
        setSelectedIndividuals([]);
        setResolvedRecords([]);
        setFindingRecords(false);
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

    const getCenterNameById = (centerId?: number) => {
        if (!centerId) return undefined;
        const center = centers.find(c => c.center_id === centerId);
        return center?.center_name;
    };

    const formatCenterDisplay = (centerId?: number) => {
        if (!centerId) return "";
        const name = getCenterNameById(centerId);
        return name || `Center #${centerId}`;
    };

    const handleSubmit = async () => {
        if (recordId) {
            // Single checkout
            await handleSingleCheckout();
        } else {
            // Batch checkout
            await handleBatchCheckout();
        }
    };

    const handleSingleCheckout = async () => {
        if (!recordId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const checkOutData: CheckOutData = {
                notes: notes || undefined,
            };

            if (typeof onCheckOut === "function") {
                await onCheckOut(recordId, checkOutData);
            } else {
                await checkOutIndividual(recordId, checkOutData);
            }

            onSuccess(1);
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to check out individual");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBatchCheckout = async () => {
        if (resolvedRecords.length === 0) {
            setError("No valid check-out records found.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const checkOutData = resolvedRecords.map(record => ({
                record_id: record.record_id,
                notes: notes || undefined,
            }));

            if (typeof onBatchCheckOut === "function") {
                await onBatchCheckOut(checkOutData);
            } else {
                await checkOutMultipleIndividuals(checkOutData);
            }

            onSuccess(resolvedRecords.length);
            resetForm();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to check out individuals");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIndividualSelect = async (individual: Individual) => {
        // Check if individual is already selected
        if (selectedIndividuals.find(ind => ind.individual_id === individual.individual_id)) {
            return;
        }

        setSelectedIndividuals(prev => [...prev, individual]);
        
        // Find active record for this individual
        setFindingRecords(true);
        try {
            const history = await fetchIndividualAttendanceHistory(individual.individual_id);
            const active = (history as any[]).find(r => r.status === "checked_in" && !r.check_out_time);
            
            if (active) {
                // Check if individual is in the default center (if defaultCenterId is provided)
                const isInDefaultCenter = !defaultCenterId || active.center_id === defaultCenterId;
                
                if (isInDefaultCenter) {
                    setResolvedRecords(prev => [...prev, { 
                        individual, 
                        record_id: active.record_id,
                        center_id: active.center_id 
                    }]);
                    setError(null);
                } else {
                    const activeCenterDisplay = formatCenterDisplay(active.center_id);
                    const defaultCenterDisplay = formatCenterDisplay(defaultCenterId);
                    setError(
                        `Individual ${individual.first_name} ${individual.last_name} is checked into ${activeCenterDisplay}, not your center (${defaultCenterDisplay}).`
                    );
                    // Remove individual if not in the right center
                    setSelectedIndividuals(prev => prev.filter(ind => ind.individual_id !== individual.individual_id));
                }
            } else {
                setError(`Individual ${individual.first_name} ${individual.last_name} has no active check-in record to check out.`);
                // Remove individual if no active record found
                setSelectedIndividuals(prev => prev.filter(ind => ind.individual_id !== individual.individual_id));
            }
        } catch (err: any) {
            setError(err?.message || "Failed to retrieve attendance history");
            // Remove individual if error
            setSelectedIndividuals(prev => prev.filter(ind => ind.individual_id !== individual.individual_id));
        } finally {
            setFindingRecords(false);
        }
    };

    const handleRemoveIndividual = (individualId: number) => {
        setSelectedIndividuals(prev => prev.filter(ind => ind.individual_id !== individualId));
        setResolvedRecords(prev => prev.filter(record => record.individual.individual_id !== individualId));
    };

    const handleClearAllIndividuals = () => {
        setSelectedIndividuals([]);
        setResolvedRecords([]);
    };

    // MODAL SEARCH FUNCTION (same pattern as CheckInModal)
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

    // HANDLE PAGE CHANGE
    const handleModalPageChange = (page: number) => {
        setModalPage(page);
        
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        // If search is empty, clear results immediately
        if (modalSearchQuery.trim() === "") {
            setModalSearchResults([]);
            setModalTotalRecords(0);
        } else {
            // Trigger search with new page
            handleModalSearch({
                search: modalSearchQuery,
                page: page,
                limit: 10
            });
        }
    };

    const getSubmitButtonText = () => {
        if (recordId) {
            return isSubmitting ? "Checking Out..." : "Check Out";
        } else {
            const count = resolvedRecords.length;
            return isSubmitting 
                ? `Checking Out ${count} Individual${count !== 1 ? 's' : ''}...` 
                : `Check Out ${count} Individual${count !== 1 ? 's' : ''}`;
        }
    };

    // Info message about center restriction
    const centerRestrictionInfo = defaultCenterId ? (
        <div className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800 mb-4">
            <div className="font-medium">Check-out Restriction:</div>
            <div>
                You can only check out individuals currently checked into{" "}
                {formatCenterDisplay(defaultCenterId)}
            </div>
        </div>
    ) : null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {recordId ? "Check Out Individual" : "Check Out Individuals"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {!recordId && centerRestrictionInfo}

                    {recordId ? (
                        // Single checkout UI
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to check out this individual? This will mark their
                                attendance as completed.
                            </p>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Notes</Label>
                                <Textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Reason for check-out or additional notes (optional)"
                                    className="w-full min-h-[80px]"
                                    maxLength={100}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {notes.length}/100 characters
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Batch checkout UI (following CheckInModal pattern)
                        <div className="space-y-6">
                            {/* Selected Individuals Display - Similar to CheckInModal */}
                            {selectedIndividuals.length > 0 && (
                                <div className="space-y-3 border-b pb-6">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">
                                            Selected Individuals ({resolvedRecords.length} ready for check-out)
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
                                        {selectedIndividuals.map(individual => {
                                            const record = resolvedRecords.find(r => r.individual.individual_id === individual.individual_id);
                                            return (
                                                <div
                                                    key={individual.individual_id}
                                                    className={`flex justify-between items-center p-3 rounded-lg border ${
                                                        record
                                                            ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                                            : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {individual.first_name} {individual.last_name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ID: {individual.individual_id}
                                                            {individual.gender && ` • ${individual.gender}`}
                                                            {individual.date_of_birth &&
                                                                ` • DOB: ${new Date(individual.date_of_birth).toLocaleDateString()}`}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 text-sm">
                                                            <Home className="h-3 w-3" />
                                                            Household ID: {individual.household_id}
                                                        </div>
                                                        {record ? (
                                                            <div className="text-sm text-green-600 mt-1">
                                                                ✓ Ready to check out (Record #{record.record_id})
                                                                {record.center_id && ` • Center: ${formatCenterDisplay(record.center_id)}`}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-yellow-600 mt-1">
                                                                ⏳ Finding active record...
                                                            </div>
                                                        )}
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
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Individual Search and Selection - Using same pattern as CheckInModal */}
                            <div className="space-y-4 border-b pb-6">
                                <Label className="text-base font-semibold">
                                    Search and Select Individuals to Check Out *
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

                                {findingRecords && (
                                    <div className="p-2 text-sm text-muted-foreground">
                                        Finding active attendance records...
                                    </div>
                                )}
                            </div>

                            {/* Notes for batch checkout */}
                            {selectedIndividuals.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Reason for check-out or additional notes (optional) - will apply to all selected individuals"
                                        className="w-full min-h-[80px]"
                                        maxLength={100}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {notes.length}/100 characters
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (recordId ? false : resolvedRecords.length === 0)}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {getSubmitButtonText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}