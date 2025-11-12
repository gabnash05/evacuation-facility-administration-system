// FILE NAME: src/components/features/household/AddIndividualModal.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CreateIndividualData } from "@/types/individual";

interface AddIndividualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (individual: Omit<CreateIndividualData, "household_id">) => void;
}

export function AddIndividualModal({ isOpen, onClose, onAdd }: AddIndividualModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dob, setDob] = useState<Date>();
    const [gender, setGender] = useState("Male");
    const [relationship, setRelationship] = useState("");
    const [error, setError] = useState<string | null>(null);

    // --- NEW: Pre-defined list of relationship options ---
    const relationshipOptions = [
        "Spouse",
        "Child",
        "Parent",
        "Sibling",
        "Grandparent",
        "Grandchild",
        "Other",
    ];

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setDob(undefined);
        setGender("Male");
        setRelationship("");
        setError(null);
    };

    const handleAdd = () => {
        if (!firstName || !lastName || !relationship) {
            setError("First Name, Last Name, and Relationship are required.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dob && dob > today) {
            setError("Date of birth cannot be in the future.");
            return;
        }

        onAdd({
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dob ? format(dob, "yyyy-MM-dd") : undefined,
            gender: gender || undefined,
            relationship_to_head: relationship,
        });

        resetForm();
        onClose();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="Enter first name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dob && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dob ? format(dob, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dob}
                                        onSelect={setDob}
                                        disabled={date => date > new Date()}
                                        captionLayout="dropdown"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Relationship to Head *</Label>
                        <Select value={relationship} onValueChange={setRelationship}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                {relationshipOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}>Add Member</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}