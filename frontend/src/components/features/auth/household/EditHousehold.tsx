import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EvacuationCenter {
    center_id: number;
    center_name: string;
}

interface HouseholdData {
    household_id?: number;
    household_name: string;
    address: string;
    center_id: number;
}

interface EditHouseholdModalProps {
    householdId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditHouseholdModal({ householdId, isOpen, onClose, onSuccess }: EditHouseholdModalProps) {
    const [formData, setFormData] = useState<Partial<HouseholdData>>({});
    const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && householdId) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const [householdRes, centersRes] = await Promise.all([
                        fetch(`http://localhost:5000/api/households/${householdId}`),
                        fetch("http://localhost:5000/api/evacuation_centers"),
                    ]);

                    if (!householdRes.ok) throw new Error("Failed to fetch household details.");
                    if (!centersRes.ok) throw new Error("Failed to fetch evacuation centers.");

                    const householdResult = await householdRes.json();
                    const centersResult = await centersRes.json();
                    
                    // Rename 'name' to 'household_name' for consistency in the form state
                    const { name, ...restOfData } = householdResult.data;
                    setFormData({ household_name: name, ...restOfData });
                    
                    setEvacuationCenters(centersResult.data.results);

                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, householdId]);
    
    const handleInputChange = (field: keyof HouseholdData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.household_name || !formData.address || !formData.center_id) {
            setError("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        
        const { household_id, ...dataToSend } = formData;
        
        try {
            const response = await fetch(`http://localhost:5000/api/households/${householdId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "An unknown error occurred.");
            
            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        setFormData({});
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Household</DialogTitle></DialogHeader>
                {isLoading ? ( <div className="py-8 text-center">Loading...</div> ) : 
                 error ? ( <p className="py-4 text-sm text-destructive">{error}</p> ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="householdName">Household Name</Label>
                            <Input id="householdName" value={formData.household_name || ''} onChange={(e) => handleInputChange('household_name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Evacuation Center</Label>
                            <Select value={String(formData.center_id || '')} onValueChange={(value) => handleInputChange('center_id', Number(value))}>
                                <SelectTrigger><SelectValue placeholder="Select a center" /></SelectTrigger>
                                <SelectContent>
                                    {evacuationCenters.map(center => (
                                        <SelectItem key={center.center_id} value={String(center.center_id)}>
                                            {center.center_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* --- The Household Head dropdown has been removed --- */}
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" onClick={handleClose}>Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}