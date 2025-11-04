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

interface AddHouseholdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddHouseholdModal({ isOpen, onClose, onSuccess }: AddHouseholdModalProps) {
    const [householdName, setHouseholdName] = useState("");
    const [address, setAddress] = useState("");
    const [centerId, setCenterId] = useState<string | undefined>(undefined);
    const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchCenters = async () => {
                try {
                    const response = await fetch("http://localhost:5000/api/evacuation_centers");
                    if (!response.ok) throw new Error("Failed to fetch evacuation centers.");
                    const result = await response.json();
                    setEvacuationCenters(result.data.results);
                } catch (err) {
                    setError("Could not load evacuation centers. Please try again.");
                }
            };
            fetchCenters();
        }
    }, [isOpen]);
    
    const resetForm = () => {
        setHouseholdName("");
        setAddress("");
        setCenterId(undefined);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!householdName || !address || !centerId) {
            setError("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch("http://localhost:5000/api/households", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ household_name: householdName, address, center_id: Number(centerId) }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "An unknown error occurred.");
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
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Household</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="householdName">Household Name</Label>
                        <Input id="householdName" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Evacuation Center</Label>
                        <Select value={centerId} onValueChange={setCenterId}>
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
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Household"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}