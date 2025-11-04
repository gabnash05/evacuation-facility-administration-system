// FILE NAME: src/components/features/auth/household/AddHouseholdModal.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddIndividualModal, type NewIndividual } from "./AddIndividualModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    
    const [individuals, setIndividuals] = useState<NewIndividual[]>([]);
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    
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
        setIndividuals([]);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // --- THIS FUNCTION IS NOW SMARTER ---
    const handleAddIndividual = (newIndividual: NewIndividual) => {
        // Check if the new member is being set as 'Head'
        if (newIndividual.relationship_to_head.toLowerCase().trim() === 'head') {
            // Check if a head already exists in the current list
            const hasHead = individuals.some(ind => ind.relationship_to_head.toLowerCase().trim() === 'head');
            if (hasHead) {
                // If a head exists, show an error and do not add the new member
                alert("Error: This household already has a designated Head. Please change the relationship before adding.");
                return; // Stop the function
            }
        }
        setIndividuals(prev => [...prev, newIndividual]);
    };

    const handleSubmit = async () => {
        if (!householdName || !address || !centerId) {
            setError("Household Name, Address, and Evacuation Center are required.");
            return;
        }
        if (individuals.length === 0) {
            setError("You must add at least one member to the household.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch("http://localhost:5000/api/households-with-individuals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    household_name: householdName,
                    address,
                    center_id: Number(centerId),
                    individuals: individuals,
                }),
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
        <>
            <AddIndividualModal
                isOpen={isIndividualModalOpen}
                onClose={() => setIsIndividualModalOpen(false)}
                onAdd={handleAddIndividual}
            />
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Add New Household</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Household Name</Label><Input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2"><Label>Evacuation Center</Label><Select value={centerId} onValueChange={setCenterId}><SelectTrigger><SelectValue placeholder="Select a center" /></SelectTrigger><SelectContent>{evacuationCenters.map(center => (<SelectItem key={center.center_id} value={String(center.center_id)}>{center.center_name}</SelectItem>))}</SelectContent></Select></div>
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between items-center"><Label>Members</Label><Button variant="outline" size="sm" onClick={() => setIsIndividualModalOpen(true)}>Add Member</Button></div>
                            {individuals.length > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>First Name</TableHead><TableHead>Last Name</TableHead><TableHead>Relationship</TableHead></TableRow></TableHeader>
                                        <TableBody>{individuals.map((ind, index) => (<TableRow key={index}><TableCell>{ind.first_name}</TableCell><TableCell>{ind.last_name}</TableCell><TableCell>{ind.relationship_to_head}</TableCell></TableRow>))}</TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-4">No members added yet.</div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Household"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}