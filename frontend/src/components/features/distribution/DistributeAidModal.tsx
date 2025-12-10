import { useState, useMemo, useEffect } from "react";
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

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type SelectedItemState = {
    [allocationId: number]: {
        selected: boolean;
        quantity: number;
    };
};

export function DistributeAidModal({ isOpen, onClose }: Props) {
    const { user } = useAuthStore();
    const { 
        centers, 
        allocations, 
        households, 
        submitDistribution, 
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
            // Reset all form state
            setHouseholdSearch("");
            setSelectedHouseholdId(null);
            setSelection({});
            setOperationError(null);
            clearError();
        }
    }, [isOpen, clearError]);

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
                return {
                    ...prev,
                    [allocId]: { selected: true, quantity: 1 }
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
                selected: true, 
                quantity: Math.min(numQty, max) 
            }
        }));
    };

    const handleSubmit = async () => {
        if (!selectedHouseholdId || !selectedCenterId) return;

        const itemsToDistribute = Object.entries(selection)
            .filter(([_, val]) => val.selected)
            .map(([allocId, val]) => ({
                allocationId: Number(allocId),
                quantity: val.quantity
            }));

        if (itemsToDistribute.length === 0) {
            setOperationError("Please select at least one item to distribute.");
            return;
        }

        const result = await submitDistribution(selectedHouseholdId, selectedCenterId, itemsToDistribute);
        
        if (result.success) {
            // Reset form on successful submission
            setSelection({});
            setSelectedHouseholdId(null);
            setHouseholdSearch("");
            setOperationError(null);
            onClose();
        } else {
            setOperationError(result.error || "Failed to distribute items. Please try again.");
        }
    };

    const totalItemsSelected = Object.values(selection).filter(s => s.selected).length;
    
    // Check if user is restricted to a specific center
    const isCenterRestricted = user?.center_id && (user.role === 'center_admin' || user.role === 'volunteer');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Distribute Relief Goods</DialogTitle>
                    <DialogDescription>
                        Select a center and household, then choose items to distribute.
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
                            <div className="text-xs text-muted-foreground">You can only distribute from your assigned center.</div>
                        </div>
                    )}

                    {/* Household Selection - Always visible, but disabled if no center selected */}
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

                    {/* Aid Items Section - Always visible but disabled if no household selected */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Select Relief Items</Label>
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
                                        Please allocate aid items to this center before distributing.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {centerAllocations.map((alloc: any) => {
                                        const isSelected = !!selection[alloc.allocation_id]?.selected;
                                        const currentQty = selection[alloc.allocation_id]?.quantity || 1;
                                        const isOutOfStock = alloc.remaining_quantity === 0;

                                        return (
                                            <div 
                                                key={alloc.allocation_id} 
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-md border transition-colors",
                                                    isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
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
                                                    </Label>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="text-[10px] h-5">{alloc.category_name}</Badge>
                                                        <span>Stock: {alloc.remaining_quantity}</span>
                                                    </div>
                                                </div>

                                                {isSelected && selectedHousehold && (
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Qty:</Label>
                                                        <Input 
                                                            type="number" 
                                                            className="w-20 h-8"
                                                            value={currentQty}
                                                            onChange={(e) => handleQuantityChange(alloc.allocation_id, e.target.value, alloc.remaining_quantity)}
                                                            min={1}
                                                            max={alloc.remaining_quantity}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !selectedHouseholdId || !selectedCenterId || totalItemsSelected === 0}
                    >
                        {isLoading ? "Processing..." : `Distribute ${totalItemsSelected} Items`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}