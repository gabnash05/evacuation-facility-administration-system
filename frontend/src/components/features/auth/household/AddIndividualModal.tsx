// FILE NAME: src/components/features/auth/household/AddIndividualModal.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export interface NewIndividual {
    first_name: string;
    last_name: string;
    relationship_to_head: string;
}

interface AddIndividualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (individual: NewIndividual) => void;
}

export function AddIndividualModal({ isOpen, onClose, onAdd }: AddIndividualModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [relationship, setRelationship] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleAdd = () => {
        if (!firstName || !lastName || !relationship) {
            setError("All fields are required.");
            return;
        }
        
        onAdd({
            first_name: firstName,
            last_name: lastName,
            relationship_to_head: relationship,
        });

        setFirstName("");
        setLastName("");
        setRelationship("");
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="relationship">Relationship to Head</Label><Input id="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g., Head, Spouse, Child" /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Member</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}