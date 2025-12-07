import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useDistributionStore } from "@/store/distributionStore";
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
    const { allocations, households, submitDistribution, isLoading } = useDistributionStore();
    
    const [householdSearch, setHouseholdSearch] = useState("");
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    
    const [selection, setSelection] = useState<SelectedItemState>({});

    const filteredHouseholds = useMemo(() => {
        if (!householdSearch) return [];
        return households.filter(h => 
            h.household_name.toLowerCase().includes(householdSearch.toLowerCase()) || 
            h.family_head.toLowerCase().includes(householdSearch.toLowerCase())
        ).slice(0, 5); 
    }, [households, householdSearch]);

    const selectedHousehold = households.find(h => h.household_id === selectedHouseholdId);

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
        if (!selectedHouseholdId) return;

        const itemsToDistribute = Object.entries(selection)
            .filter(([_, val]) => val.selected)
            .map(([allocId, val]) => ({
                allocationId: Number(allocId),
                quantity: val.quantity
            }));

        if (itemsToDistribute.length === 0) return;

        await submitDistribution(selectedHouseholdId, itemsToDistribute);
        
        setSelection({});
        setSelectedHouseholdId(null);
        setHouseholdSearch("");
        onClose();
    };

    const totalItemsSelected = Object.values(selection).filter(s => s.selected).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Distribute Relief Goods</DialogTitle>
                    <DialogDescription>
                        Select a household and choose items to distribute.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4 overflow-y-auto">
                    
                    <div className="space-y-3">
                        <Label>Find Household</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by family name or head..." 
                                className="pl-8"
                                value={householdSearch}
                                onChange={(e) => setHouseholdSearch(e.target.value)}
                            />
                        </div>

                        {householdSearch && !selectedHousehold && (
                            <div className="border rounded-md divide-y bg-background shadow-sm">
                                {filteredHouseholds.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground text-center">No families found.</div>
                                ) : (
                                    filteredHouseholds.map(h => (
                                        <button 
                                            key={h.household_id}
                                            onClick={() => {
                                                setSelectedHouseholdId(h.household_id);
                                                setHouseholdSearch(""); // clear search to hide list
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
                            <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-md">
                                <div>
                                    <div className="font-bold text-blue-900">{selectedHousehold.household_name}</div>
                                    <div className="text-xs text-blue-700">
                                        Head of Family: {selectedHousehold.family_head}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedHouseholdId(null)} className="text-blue-600 hover:text-blue-800">
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="border-t"></div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Select Relief Items</Label>
                            <span className="text-xs text-muted-foreground">
                                {allocations.filter(a => a.status === 'active').length} types available
                            </span>
                        </div>

                        <div className="h-[250px] border rounded-md p-2 overflow-y-auto">
                            <div className="space-y-1">
                                {allocations.map((alloc) => {
                                    const isSelected = !!selection[alloc.allocation_id]?.selected;
                                    const currentQty = selection[alloc.allocation_id]?.quantity || 1;
                                    const isOutOfStock = alloc.remaining_quantity === 0;

                                    return (
                                        <div 
                                            key={alloc.allocation_id} 
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-md border transition-colors",
                                                isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                                                isOutOfStock && "opacity-60 pointer-events-none"
                                            )}
                                        >
                                            <Checkbox 
                                                id={`item-${alloc.allocation_id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleItem(alloc.allocation_id, alloc.remaining_quantity)}
                                                disabled={isOutOfStock}
                                            />
                                            
                                            <div className="flex-1 grid gap-1">
                                                <Label 
                                                    htmlFor={`item-${alloc.allocation_id}`} 
                                                    className="font-medium cursor-pointer"
                                                >
                                                    {alloc.resource_name}
                                                </Label>
                                                <div className="flex gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px] h-5">{alloc.category_name}</Badge>
                                                    <span>Stock: {alloc.remaining_quantity}</span>
                                                </div>
                                            </div>

                                            {isSelected && (
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
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !selectedHouseholdId || totalItemsSelected === 0}
                    >
                        {isLoading ? "Processing..." : `Distribute ${totalItemsSelected} Items`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}