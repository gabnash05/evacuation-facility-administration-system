import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useDistributionStore } from "@/store/distributionStore";
import { useAuthStore } from "@/store/authStore";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DistributionRecord } from "@/types/distribution";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    record: DistributionRecord | null;
}

type SelectedItemState = {
    [allocationId: number]: {
        selected: boolean;
        quantity: number;
        resource_name?: string;
        category_name?: string;
    };
};

export function EditDistributionModal({ isOpen, onClose, record }: Props) {
    const { user } = useAuthStore();
    const { 
        centers, 
        households, 
        updateDistribution, 
        isLoading,
        error,
        selectedCenterId,
        setSelectedCenterId,
        getCenterAllocations,
        clearError
    } = useDistributionStore();
    
    const [householdSearch, setHouseholdSearch] = useState("");
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [selection, setSelection] = useState<SelectedItemState>({});
    const [operationError, setOperationError] = useState<string | null>(null);

    // Clear all form data when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHouseholdSearch("");
            setSelectedHouseholdId(null);
            setSelection({});
            setOperationError(null);
            clearError();
        }
    }, [isOpen, clearError]);

    // Pre-fill form when record opens - FIXED VERSION
    useEffect(() => {
        if (record && isOpen) {
            // Set center - check all possible property names
            const centerId = record.center_id || (record as any)?.center?.center_id || null;
            setSelectedCenterId(centerId);
            
            // Set household - check all possible property names
            setSelectedHouseholdId(record.household_id);
            
            // IMPORTANT FIX: Pre-select ONLY the specific item being edited
            setSelection({
                [record.allocation_id]: {
                    selected: true,
                    quantity: record.quantity,
                    resource_name: record.resource_name,
                    category_name: record.category_name
                }
            });
            
            // Pre-fill household search with the household name
            const householdName = record.household_name || "";
            setHouseholdSearch(householdName);
            
            setOperationError(null);
        }
    }, [record, isOpen, setSelectedCenterId]);

    // Auto-select center for restricted users
    useEffect(() => {
        if (user?.center_id && (user.role === 'center_admin' || user.role === 'volunteer')) {
            setSelectedCenterId(user.center_id);
        }
    }, [user, setSelectedCenterId]);

    // Clear operation error when form changes
    useEffect(() => {
        setOperationError(null);
    }, [selectedCenterId, selectedHouseholdId, selection]);

    // Filter households by selected center
    const centerHouseholds = useMemo(() => {
        if (!selectedCenterId) return [];
        return households.filter(h => h.center_id === selectedCenterId);
    }, [households, selectedCenterId]);

    // Filter allocations by selected center
    const centerAllocations = useMemo(() => {
        if (!selectedCenterId) return [];
        return getCenterAllocations(selectedCenterId);
    }, [selectedCenterId, getCenterAllocations]);

    const filteredHouseholds = useMemo(() => {
        if (!householdSearch) return [];
        return centerHouseholds.filter(h => 
            h.household_name.toLowerCase().includes(householdSearch.toLowerCase()) || 
            h.family_head.toLowerCase().includes(householdSearch.toLowerCase())
        ).slice(0, 5);
    }, [centerHouseholds, householdSearch]);

    const selectedHousehold = centerHouseholds.find(h => h.household_id === selectedHouseholdId);

    const handleToggleItem = (allocId: number, maxQty: number) => {
        setSelection(prev => {
            const isSelected = !!prev[allocId]?.selected;
            if (isSelected) {
                const newState = { ...prev };
                delete newState[allocId];
                return newState;
            } else {
                // Only allow selecting one item at a time for editing
                const newState = Object.keys(prev).reduce((acc, key) => {
                    acc[Number(key)] = { ...prev[Number(key)], selected: false };
                    return acc;
                }, {} as SelectedItemState);
                
                // Find the allocation details
                const allocation = centerAllocations.find(a => a.allocation_id === allocId);
                
                return {
                    ...newState,
                    [allocId]: { 
                        selected: true, 
                        quantity: 1,
                        resource_name: allocation?.resource_name,
                        category_name: allocation?.category_name
                    }
                };
            }
        });
    };

    const handleQuantityChange = (allocId: number, qty: string, max: number) => {
        const numQty = parseInt(qty);
        if (isNaN(numQty) || numQty < 1) return;
        
        setSelection(prev => ({
            ...prev,
            [allocId]: { 
                ...prev[allocId],
                selected: true, 
                quantity: Math.min(numQty, max) 
            }
        }));
    };

    const handleSubmit = async () => {
        if (!selectedHouseholdId || !selectedCenterId || !record) return;

        const itemsToUpdate = Object.entries(selection)
            .filter(([_, val]) => val.selected)
            .map(([allocId, val]) => ({
                allocationId: Number(allocId),
                quantity: val.quantity
            }));

        if (itemsToUpdate.length === 0) {
            setOperationError("Please select an item to update.");
            return;
        }

        // For edit, we only update one item at a time
        const item = itemsToUpdate[0];
        
        const result = await updateDistribution(record.distribution_id, {
            household_id: selectedHouseholdId,
            allocation_id: item.allocationId,
            quantity: item.quantity,
            center_id: selectedCenterId
        });
        
        if (result.success) {
            // Reset form on successful submission
            setSelection({});
            setSelectedHouseholdId(null);
            setHouseholdSearch("");
            setOperationError(null);
            onClose();
        } else {
            setOperationError(result.error || "Failed to update distribution. Please try again.");
        }
    };

    const totalItemsSelected = Object.values(selection).filter(s => s.selected).length;
    
    // Check if user is restricted to a specific center
    const isCenterRestricted = user?.center_id && (user.role === 'center_admin' || user.role === 'volunteer');

    // Get the currently selected allocation for quantity validation
    const selectedAllocationId = Object.keys(selection).find(key => selection[Number(key)]?.selected);
    const selectedAllocation = selectedAllocationId ? 
        centerAllocations.find(a => a.allocation_id === Number(selectedAllocationId)) : null;

    // Calculate max quantity including the currently allocated quantity - FIXED
    const calculateMaxQuantity = (allocation: any) => {
        if (!allocation) return 0;
        
        // If this is the same allocation being edited, add back the current quantity
        if (allocation.allocation_id === record?.allocation_id) {
            return allocation.remaining_quantity + record!.quantity;
        }
        
        // Otherwise just use the remaining quantity
        return allocation.remaining_quantity;
    };

    // Get the record's allocation details for display
    const recordAllocationDetails = useMemo(() => {
        if (!record) return null;
        const allocation = centerAllocations.find(a => a.allocation_id === record.allocation_id);
        if (allocation) return allocation;
        
        // If not found in current allocations, use record data
        return {
            allocation_id: record.allocation_id,
            resource_name: record.resource_name,
            category_name: record.category_name,
            remaining_quantity: 0 // Unknown since not in current allocations
        };
    }, [record, centerAllocations]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Distribution</DialogTitle>
                    <DialogDescription>
                        Update the distribution details for this record.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4 overflow-y-auto">
                    {/* Error Display */}
                    {(error || operationError) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {operationError || error}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Display current record info */}
                    {record && (
                        <div className="p-3 bg-muted/30 rounded-md border">
                            <h4 className="font-semibold mb-2">Current Record</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Household:</span>
                                    <span className="ml-2 font-medium">{record.household_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Item:</span>
                                    <span className="ml-2 font-medium">{record.resource_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="ml-2 font-medium">{record.quantity}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="ml-2 font-medium">
                                        {new Date(record.distribution_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Center Selection (only for non-restricted users) */}
                    {!isCenterRestricted && (
                        <div className="space-y-3">
                            <Label htmlFor="center-select">Select Center</Label>
                            <Select
                                value={selectedCenterId ? String(selectedCenterId) : ""}
                                onValueChange={(value) => {
                                    setSelectedCenterId(value ? Number(value) : null);
                                    // Clear dependent selections when center changes
                                    setSelectedHouseholdId(null);
                                    setHouseholdSearch("");
                                    setSelection({});
                                    setOperationError(null);
                                }}
                            >
                                <SelectTrigger id="center-select">
                                    <SelectValue placeholder="Choose an evacuation center..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {centers.map((center: any) => (
                                        <SelectItem key={center.center_id} value={String(center.center_id)}>
                                            {center.center_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedCenterId && (
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-5">
                                        Selected
                                    </Badge>
                                    <span>{centers.find((c: any) => c.center_id === selectedCenterId)?.center_name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {isCenterRestricted && selectedCenterId && (
                        <div className="p-3 border border-border bg-muted/30 rounded-md">
                            <div className="font-bold text-foreground">Center: {centers.find((c: any) => c.center_id === selectedCenterId)?.center_name}</div>
                            <div className="text-xs text-muted-foreground">You can only edit distributions from your assigned center.</div>
                        </div>
                    )}

                    {/* Household Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="household-search">Find Household</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="household-search"
                                placeholder="Search by family name or head..." 
                                className="pl-8"
                                value={householdSearch}
                                onChange={(e) => {
                                    setHouseholdSearch(e.target.value);
                                    setOperationError(null);
                                }}
                                disabled={!selectedCenterId}
                            />
                        </div>

                        {!selectedCenterId && (
                            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                                Please select a center first to search for households.
                            </div>
                        )}

                        {selectedCenterId && householdSearch && !selectedHousehold && (
                            <div className="border rounded-md divide-y bg-background shadow-sm">
                                {filteredHouseholds.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground text-center">
                                        {centerHouseholds.length === 0 ? 
                                            "No households registered in this center." : 
                                            "No families found."}
                                    </div>
                                ) : (
                                    filteredHouseholds.map((h: any) => (
                                        <button 
                                            key={h.household_id}
                                            onClick={() => {
                                                setSelectedHouseholdId(h.household_id);
                                                setHouseholdSearch("");
                                                setOperationError(null);
                                            }}
                                            className="w-full text-left p-3 hover:bg-muted text-sm flex justify-between items-center"
                                        >
                                            <span className="font-medium">{h.household_name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                Head: {h.family_head}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {selectedHousehold && (
                            <div className="flex items-center justify-between p-3 border border-border bg-card rounded-md">
                                <div>
                                    <div className="font-bold text-card-foreground">{selectedHousehold.household_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Head of Family: {selectedHousehold.family_head}
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        setSelectedHouseholdId(null);
                                        setHouseholdSearch("");
                                        setOperationError(null);
                                    }} 
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Aid Items Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Select Relief Item</Label>
                            <span className="text-xs text-muted-foreground">
                                {selectedCenterId 
                                    ? `${centerAllocations.filter((a: any) => a.status === 'active').length} types available at this center`
                                    : "Select a center to view available items"}
                            </span>
                        </div>

                        <div className={cn(
                            "h-[250px] border rounded-md p-2 overflow-y-auto",
                            !selectedCenterId || !selectedHousehold ? "bg-muted/30" : ""
                        )}>
                            {!selectedCenterId ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                                    <p className="text-sm mb-2">Select a center first</p>
                                    <p className="text-xs text-center">
                                        Choose an evacuation center to view available aid items.
                                    </p>
                                </div>
                            ) : !selectedHousehold ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                                    <p className="text-sm mb-2">Select a household first</p>
                                    <p className="text-xs text-center">
                                        Choose a household to distribute aid items to.
                                    </p>
                                </div>
                            ) : centerAllocations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                                    <p className="text-sm mb-2">No aid items allocated to this center.</p>
                                    <p className="text-xs text-center">
                                        Please allocate aid items to this center before editing.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {centerAllocations.map((alloc: any) => {
                                        const isSelected = !!selection[alloc.allocation_id]?.selected;
                                        const currentQty = selection[alloc.allocation_id]?.quantity || 1;
                                        const isOutOfStock = alloc.remaining_quantity === 0;
                                        
                                        // Highlight if this is the allocation from the record being edited
                                        const isCurrentRecordAllocation = record?.allocation_id === alloc.allocation_id;

                                        return (
                                            <div 
                                                key={alloc.allocation_id} 
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-md border transition-colors",
                                                    isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                                                    isCurrentRecordAllocation && !isSelected && "border-amber-300 bg-amber-50",
                                                    isOutOfStock && "opacity-60 pointer-events-none",
                                                    !selectedHousehold && "opacity-50 pointer-events-none"
                                                )}
                                            >
                                                <Checkbox 
                                                    id={`item-${alloc.allocation_id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleItem(alloc.allocation_id, alloc.remaining_quantity)}
                                                    disabled={isOutOfStock || !selectedHousehold}
                                                />
                                                
                                                <div className="flex-1 grid gap-1">
                                                    <Label 
                                                        htmlFor={`item-${alloc.allocation_id}`} 
                                                        className={cn(
                                                            "font-medium",
                                                            selectedHousehold ? "cursor-pointer" : "cursor-not-allowed"
                                                        )}
                                                    >
                                                        {alloc.resource_name}
                                                        {isCurrentRecordAllocation && (
                                                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                                                Currently: {record?.quantity} units
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="text-[10px] h-5">{alloc.category_name}</Badge>
                                                        <span>Stock: {alloc.remaining_quantity}</span>
                                                        {isCurrentRecordAllocation && (
                                                            <span className="text-amber-600">
                                                                + {record?.quantity} currently allocated
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isSelected && selectedHousehold && (
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Qty:</Label>
                                                        <Input 
                                                            type="number" 
                                                            className="w-20 h-8"
                                                            value={currentQty}
                                                            onChange={(e) => handleQuantityChange(
                                                                alloc.allocation_id, 
                                                                e.target.value, 
                                                                calculateMaxQuantity(alloc)
                                                            )}
                                                            min={1}
                                                            max={calculateMaxQuantity(alloc)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        {selectedAllocation && record && (
                            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                                <p>Note: You can allocate up to {calculateMaxQuantity(selectedAllocation)} units (current stock: {selectedAllocation.remaining_quantity} + currently allocated: {record.quantity}).</p>
                                <p>Changing the quantity will adjust the stock accordingly.</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !selectedHouseholdId || !selectedCenterId || totalItemsSelected === 0}
                    >
                        {isLoading ? "Saving..." : `Update Distribution`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}