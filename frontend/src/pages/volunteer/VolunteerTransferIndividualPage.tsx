import { useState, useEffect, useCallback } from "react";
import { Search, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransferIndividualsTable } from "@/components/features/transfer/TransferIndividualsTable";
import { TransferDestinationTabs } from "@/components/features/transfer/TransferDestinationTabs";
import { TransferReasonSelect } from "@/components/features/transfer/TransferReasonSelect";
import { TransferIndividualModal } from "@/components/features/transfer/TransferIndividualModal";
import { SuccessToast } from "@/components/common/SuccessToast";
import { TransferService } from "@/services/transferService";
import { validateTransferForm } from "@/schemas/transfer";
import type { TransferIndividual, TransferReason, TransferDestinationType } from "@/types/transfer";

export function VolunteerTransferIndividualPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [individuals, setIndividuals] = useState<TransferIndividual[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndividuals, setSelectedIndividuals] = useState<number[]>([]);
    const [destinationType, setDestinationType] = useState<TransferDestinationType>("center");
    const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
    const [transferReason, setTransferReason] = useState<TransferReason | "">("");
    const [successToast, setSuccessToast] = useState({ isOpen: false, message: "" });
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    
    // Modal state
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Debounce search query - waits 500ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch individuals when debounced search changes
    useEffect(() => {
        const fetchIndividuals = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await TransferService.getIndividualsForTransfer({
                    search: debouncedSearch,
                });
                if (response.data) {
                    setIndividuals(response.data.results);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load individuals");
            } finally {
                setLoading(false);
            }
        };

        fetchIndividuals();
    }, [debouncedSearch]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleSelectIndividual = (individualId: number) => {
        setSelectedIndividuals(prev =>
            prev.includes(individualId)
                ? prev.filter(id => id !== individualId)
                : [...prev, individualId]
        );
    };

    // Sort individuals
    const sortedIndividuals = [...individuals].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
            case "name":
                aValue = `${a.first_name} ${a.last_name}`;
                bValue = `${b.first_name} ${b.last_name}`;
                break;
            case "household":
                aValue = a.household_name;
                bValue = b.household_name;
                break;
            case "currentCenter":
                aValue = a.center_name;
                bValue = b.center_name;
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
            return sortDirection === "asc" ? comparison : -comparison;
        }

        return 0;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndividuals(sortedIndividuals.map(i => i.individual_id));
        } else {
            setSelectedIndividuals([]);
        }
    };

    const handleConfirmTransfer = async () => {
        // Validate form
        const validation = validateTransferForm({
            individual_ids: selectedIndividuals,
            destination_type: destinationType,
            destination_center_id: selectedCenterId,
            reason: transferReason,
        });

        if (!validation.success && validation.errors) {
            const errorMessages = Object.values(validation.errors).flat().join(", ");
            setError(errorMessages);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await TransferService.transferIndividuals({
                individual_ids: selectedIndividuals,
                destination_type: destinationType,
                destination_center_id: selectedCenterId || undefined,
                reason: transferReason as TransferReason,
            });

            if (response.data) {
                setSuccessToast({
                    isOpen: true,
                    message: response.data.message,
                });
            }

            // Reset form
            setSelectedIndividuals([]);
            setDestinationType("center");
            setSelectedCenterId(null);
            setTransferReason("");

            // Refresh individuals list
            const refreshResponse = await TransferService.getIndividualsForTransfer({
                search: debouncedSearch,
            });
            if (refreshResponse.data) {
                setIndividuals(refreshResponse.data.results);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transfer individuals");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectedIndividuals([]);
        setDestinationType("center");
        setSelectedCenterId(null);
        setTransferReason("");
        setError(null);
    };
    
    const handleModalSuccess = () => {
        setSuccessToast({
            isOpen: true,
            message: "Individual transferred successfully!",
        });
        // Refresh the list
        const fetchIndividuals = async () => {
            try {
                const response = await TransferService.getIndividualsForTransfer({
                    search: debouncedSearch,
                });
                if (response.data) {
                    setIndividuals(response.data.results);
                }
            } catch (err) {
                console.error("Failed to refresh individuals:", err);
            }
        };
        fetchIndividuals();
    };

    const isFormValid =
        selectedIndividuals.length > 0 &&
        transferReason &&
        (destinationType !== "center" || selectedCenterId !== null);

    // Transform individuals for display
    const displayIndividuals = sortedIndividuals.map(ind => ({
        individual_id: ind.individual_id,
        name: `${ind.first_name} ${ind.last_name}`,
        household: ind.household_name,
        currentCenter: ind.center_name,
        status: ind.status,
    }));

    // Show loading only on initial load, not during search typing
    const showInitialLoading = loading && individuals.length === 0 && !searchQuery;

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                {/* Page Header with Test Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transfer Individual</h1>
                        <p className="text-muted-foreground">
                            Select individuals to transfer to another location
                        </p>
                    </div>
                    
                    {/* Temporary Test Button for Modal */}
                    <Button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        Open Transfer Modal (Test)
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search Name or Household"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9"
                    />
                    {loading && searchQuery !== debouncedSearch && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    )}
                </div>

                {/* Individuals Table (Full Width) */}
                {showInitialLoading ? (
                    <div className="border rounded-lg p-8 text-center">
                        <div className="text-muted-foreground">Loading individuals...</div>
                    </div>
                ) : (
                    <TransferIndividualsTable
                        individuals={displayIndividuals}
                        selectedIds={selectedIndividuals}
                        onSelectIndividual={handleSelectIndividual}
                        onSelectAll={handleSelectAll}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                    />
                )}

                {/* Transfer Destination Section */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Select Transfer Destination</h2>
                    <TransferDestinationTabs
                        activeTab={destinationType}
                        onTabChange={setDestinationType}
                        selectedCenterId={selectedCenterId}
                        onCenterSelect={setSelectedCenterId}
                    />
                </div>

                {/* Reason for Transfer */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Reason For Transfer</h2>
                    <TransferReasonSelect
                        value={transferReason}
                        onChange={val => setTransferReason(val as TransferReason | "")}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="px-8"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmTransfer}
                        disabled={!isFormValid || loading}
                        className="px-8 bg-green-600 hover:bg-green-700"
                    >
                        {loading ? "Processing..." : "✓ Confirm Transfer"}
                    </Button>
                </div>
            </div>

            {/* Success Toast */}
            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={() => setSuccessToast({ isOpen: false, message: "" })}
            />

            {/* Transfer Individual Modal - THIS IS THE FIX! */}
            <TransferIndividualModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}