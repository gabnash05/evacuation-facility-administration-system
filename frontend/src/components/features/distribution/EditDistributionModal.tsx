import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDistributionStore } from "@/store/distributionStore";
import type { DistributionRecord } from "@/types/distribution";

const schema = z.object({
    household_id: z.string().min(1, "Household is required"),
    allocation_id: z.string().min(1, "Aid Type is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

type FormData = z.infer<typeof schema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    record: DistributionRecord | null;
}

export function EditDistributionModal({ isOpen, onClose, record }: Props) {
    const { updateDistribution, households, allocations, isLoading } = useDistributionStore();
    
    // Local state for household search
    const [householdSearch, setHouseholdSearch] = useState("");
    const [selectedHouseholdName, setSelectedHouseholdName] = useState("");

    const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: { 
            household_id: "",
            allocation_id: "",
            quantity: 1 
        }
    });

    const currentHouseholdId = watch("household_id");

    // Pre-fill form when record opens
    useEffect(() => {
        if (record && isOpen) {
            reset({ 
                household_id: String(record.household_id || ""),
                allocation_id: String(record.allocation_id || ""),
                quantity: record.quantity 
            });
            // Set display name for the search box
            setSelectedHouseholdName(record.household_name);
            setHouseholdSearch("");
        }
    }, [record, isOpen, reset]);

    // Update display name if user selects a new household from dropdown
    useEffect(() => {
        if (currentHouseholdId) {
            const h = households.find(h => String(h.household_id) === currentHouseholdId);
            if (h) setSelectedHouseholdName(h.household_name);
        }
    }, [currentHouseholdId, households]);

    // Filter households for search
    const filteredHouseholds = useMemo(() => {
        if (!householdSearch) return [];
        return households.filter(h => 
            h.household_name.toLowerCase().includes(householdSearch.toLowerCase()) || 
            h.family_head.toLowerCase().includes(householdSearch.toLowerCase())
        ).slice(0, 5);
    }, [households, householdSearch]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        if (!record) return;
        await updateDistribution(record.distribution_id, {
            household_id: Number(data.household_id),
            allocation_id: Number(data.allocation_id),
            quantity: data.quantity
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Edit Distribution Record</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    
                    {/* Household Search/Select */}
                    <div className="grid gap-2 relative">
                        <Label>Household</Label>
                        
                        {/* Display currently selected household */}
                        <div className="flex items-center gap-2">
                            <Input 
                                value={selectedHouseholdName}
                                readOnly
                                className="bg-muted text-muted-foreground focus-visible:ring-0"
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    setValue("household_id", "");
                                    setSelectedHouseholdName("Select a household...");
                                    setHouseholdSearch("");
                                }}
                            >
                                Change
                            </Button>
                        </div>

                        {/* Search Input (Only visible if changing) */}
                        {!currentHouseholdId && (
                            <div className="absolute top-8 left-0 right-0 z-50 bg-background border rounded-md shadow-lg">
                                <div className="relative p-2">
                                    <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search household..." 
                                        className="pl-8"
                                        value={householdSearch}
                                        onChange={(e) => setHouseholdSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredHouseholds.map(h => (
                                        <div 
                                            key={h.household_id}
                                            className="p-2 hover:bg-muted cursor-pointer text-sm"
                                            onClick={() => {
                                                setValue("household_id", String(h.household_id));
                                                setSelectedHouseholdName(h.household_name);
                                                setHouseholdSearch("");
                                            }}
                                        >
                                            <div className="font-medium">{h.household_name}</div>
                                            <div className="text-xs text-muted-foreground">Head: {h.family_head}</div>
                                        </div>
                                    ))}
                                    {householdSearch && filteredHouseholds.length === 0 && (
                                        <div className="p-4 text-sm text-center text-muted-foreground">No results found</div>
                                    )}
                                </div>
                            </div>
                        )}
                        <input type="hidden" {...register("household_id")} />
                        {errors.household_id && <p className="text-destructive text-xs">{errors.household_id.message}</p>}
                    </div>

                    {/* Aid Type Select */}
                    <div className="grid gap-2">
                        <Label>Aid Type</Label>
                        <Controller
                            name="allocation_id"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select aid..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allocations.map(a => (
                                            <SelectItem key={a.allocation_id} value={String(a.allocation_id)}>
                                                {a.resource_name} ({a.category_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.allocation_id && <p className="text-destructive text-xs">{errors.allocation_id.message}</p>}
                    </div>

                    {/* Quantity */}
                    <div className="grid gap-2">
                        <Label>Quantity</Label>
                        <Input type="number" {...register("quantity")} />
                        {errors.quantity && <p className="text-destructive text-xs">{errors.quantity.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}