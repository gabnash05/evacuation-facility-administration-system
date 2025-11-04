// FILE NAME: src/components/features/auth/household/EditHouseholdModal.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { AddIndividualModal, type NewIndividual } from "./AddIndividualModal";

interface EvacuationCenter {
    center_id: number;
    center_name: string;
}

interface Individual {
    individual_id?: number;
    first_name: string;
    last_name: string;
    relationship_to_head: string;
}

interface HouseholdData {
    household_id?: number;
    household_name: string;
    address: string;
    center_id: number;
    household_head_id: number | null;
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
    const [individuals, setIndividuals] = useState<Individual[]>([]);
    const [isAddIndividualModalOpen, setIsAddIndividualModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && householdId) {
            const fetchData = async () => {
                setIsLoading(true); setError(null);
                try {
                    const [householdRes, centersRes, individualsRes] = await Promise.all([
                        fetch(`http://localhost:5000/api/households/${householdId}`),
                        fetch("http://localhost:5000/api/evacuation_centers"),
                        fetch(`http://localhost:5000/api/households/${householdId}/individuals`),
                    ]);
                    if (!householdRes.ok || !centersRes.ok || !individualsRes.ok) throw new Error("Failed to fetch required data.");
                    const householdResult = await householdRes.json();
                    const centersResult = await centersRes.json();
                    const individualsResult = await individualsRes.json();
                    const { name, ...restOfData } = householdResult.data;
                    setFormData({ household_name: name, household_id: householdId, ...restOfData });
                    setEvacuationCenters(centersResult.data.results);
                    setIndividuals(individualsResult.data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, householdId]);
    
    const handleHouseholdInputChange = (field: keyof HouseholdData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'household_head_id') {
            const newHeadId = value;
            const updatedIndividuals = individuals.map(ind => {
                if (ind.individual_id === newHeadId) return { ...ind, relationship_to_head: 'Head' };
                if (ind.relationship_to_head.toLowerCase() === 'head') return { ...ind, relationship_to_head: '' };
                return ind;
            });
            setIndividuals(updatedIndividuals);
        }
    };

    // --- THIS FUNCTION IS NOW SMARTER ---
    const handleIndividualChange = (index: number, field: keyof Individual, value: string) => {
        // Check if the user is trying to set a second head
        if (field === 'relationship_to_head' && value.toLowerCase().trim() === 'head') {
            // Check if another person in the list is already the head
            const otherHeadExists = individuals.some((ind, i) => 
                i !== index && ind.relationship_to_head.toLowerCase().trim() === 'head'
            );
            if (otherHeadExists) {
                alert("Error: A household head already exists. You cannot set another member as head.");
                return; // Prevent the state update
            }
        }
        const updatedIndividuals = [...individuals];
        updatedIndividuals[index] = { ...updatedIndividuals[index], [field]: value };
        setIndividuals(updatedIndividuals);
    };

    const handleDeleteIndividual = (idToDelete: number | undefined, indexToDelete: number) => {
        if (confirm("Are you sure you want to remove this member?")) {
            setIndividuals(individuals.filter((ind, index) => idToDelete ? ind.individual_id !== idToDelete : index !== indexToDelete));
        }
    };

    // --- THIS FUNCTION IS ALSO SMARTER ---
    const handleAddIndividual = (newIndividual: NewIndividual) => {
        if (newIndividual.relationship_to_head.toLowerCase().trim() === 'head') {
            const hasHead = individuals.some(ind => ind.relationship_to_head.toLowerCase().trim() === 'head');
            if (hasHead) {
                alert("Error: This household already has a designated Head. Please change the relationship before adding.");
                return;
            }
        }
        setIndividuals(prev => [...prev, newIndividual]);
    };

    const handleSubmit = async () => {
        if (!formData.household_name || !formData.address || !formData.center_id) { setError("Household Name, Address, and Evacuation Center are required."); return; }
        setIsSubmitting(true); setError(null);
        const { household_id, ...dataToSend } = formData;
        try {
            const response = await fetch(`http://localhost:5000/api/households/${householdId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...dataToSend, individuals: individuals }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "An unknown error occurred.");
            onSuccess(); onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => { setFormData({}); setIndividuals([]); setError(null); onClose(); };

    const headSelectValue = formData.household_head_id ? String(formData.household_head_id) : "none";

    return (
        <>
            <AddIndividualModal isOpen={isAddIndividualModalOpen} onClose={() => setIsAddIndividualModalOpen(false)} onAdd={handleAddIndividual} />
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>Edit Household</DialogTitle></DialogHeader>
                    {isLoading ? ( <div className="py-8 text-center">Loading...</div> ) : 
                    error ? ( <p className="py-4 text-sm text-destructive">{error}</p> ) : (
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Household Name</Label><Input value={formData.household_name || ''} onChange={(e) => handleHouseholdInputChange('household_name', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Household Head</Label><Select value={headSelectValue} onValueChange={(value) => handleHouseholdInputChange('household_head_id', value === 'none' ? null : Number(value))}><SelectTrigger><SelectValue placeholder="Select a head" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{individuals.map((ind, i) => (<SelectItem key={ind.individual_id || `new-${i}`} value={String(ind.individual_id)}>{ind.first_name} {ind.last_name}</SelectItem>))}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Address</Label><Input value={formData.address || ''} onChange={(e) => handleHouseholdInputChange('address', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Evacuation Center</Label><Select value={String(formData.center_id || '')} onValueChange={(value) => handleHouseholdInputChange('center_id', Number(value))}><SelectTrigger><SelectValue placeholder="Select a center" /></SelectTrigger><SelectContent>{evacuationCenters.map(center => (<SelectItem key={center.center_id} value={String(center.center_id)}>{center.center_name}</SelectItem>))}</SelectContent></Select></div>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between items-center"><Label className="text-lg font-semibold">Members</Label><Button variant="outline" size="sm" onClick={() => setIsAddIndividualModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Add Member</Button></div>
                                <div className="space-y-2">
                                    {individuals.map((ind, index) => (
                                        <div key={ind.individual_id || `new-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                            <Input value={ind.first_name} onChange={(e) => handleIndividualChange(index, 'first_name', e.target.value)} placeholder="First Name" />
                                            <Input value={ind.last_name} onChange={(e) => handleIndividualChange(index, 'last_name', e.target.value)} placeholder="Last Name" />
                                            <Input value={ind.relationship_to_head} onChange={(e) => handleIndividualChange(index, 'relationship_to_head', e.target.value)} placeholder="Relationship" />
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteIndividual(ind.individual_id, index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    {individuals.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No members in this household. Click "Add Member" to begin.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}