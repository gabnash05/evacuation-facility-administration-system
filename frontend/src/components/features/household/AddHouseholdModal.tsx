import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
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
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddIndividualModal } from "./AddIndividualModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useHouseholdStore } from "@/store/householdStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import type { CreateIndividualData } from "@/types/individual";

interface AddHouseholdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCenterId?: number;
}

export function AddHouseholdModal({
    isOpen,
    onClose,
    onSuccess,
    defaultCenterId,
}: AddHouseholdModalProps) {
    const { createHouseholdWithIndividuals } = useHouseholdStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();

    const [householdName, setHouseholdName] = useState("");
    const [address, setAddress] = useState("");
    const [centerId, setCenterId] = useState<string | undefined>(undefined);

    // Household head fields
    const [headFirstName, setHeadFirstName] = useState("");
    const [headLastName, setHeadLastName] = useState("");
    const [headDob, setHeadDob] = useState<Date>();
    const [headGender, setHeadGender] = useState("Male");

    const [individuals, setIndividuals] = useState<Omit<CreateIndividualData, "household_id">[]>(
        []
    );
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Only fetch all centers if a default isn't provided (i.e., for City Admin)
            if (!defaultCenterId) {
                fetchAllCenters();
            }
            // If a default center ID is provided (for Center Admins), set it.
            if (defaultCenterId) {
                setCenterId(String(defaultCenterId));
            }
        }
    }, [isOpen, fetchAllCenters, defaultCenterId]);

    const resetForm = () => {
        setHouseholdName("");
        setAddress("");
        setCenterId(undefined);
        setHeadFirstName("");
        setHeadLastName("");
        setHeadDob(undefined);
        setHeadGender("Male");
        setIndividuals([]);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleAddIndividual = (newIndividual: Omit<CreateIndividualData, "household_id">) => {
        if (newIndividual.relationship_to_head.toLowerCase().trim() === "head") {
            alert(
                "Error: The primary household head is defined above. Additional members cannot be 'Head'."
            );
            return;
        }
        setIndividuals(prev => [...prev, newIndividual]);
    };

    const handleRemoveIndividual = (index: number) => {
        setIndividuals(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!headFirstName || !headLastName) {
            setError("Household head first name and last name are required.");
            return;
        }

        if (!householdName || !address || !centerId) {
            setError("Household Name, Address, and Evacuation Center are required.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (headDob && headDob > today) {
            setError("Household head date of birth cannot be in the future.");
            return;
        }

        for (const ind of individuals) {
            if (ind.date_of_birth && new Date(ind.date_of_birth) > today) {
                setError(`Error for ${ind.first_name}: Date of birth cannot be in the future.`);
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const allIndividuals = [
                {
                    first_name: headFirstName,
                    last_name: headLastName,
                    date_of_birth: headDob ? format(headDob, "yyyy-MM-dd") : undefined,
                    gender: headGender || undefined,
                    relationship_to_head: "Head",
                },
                ...individuals,
            ];

            await createHouseholdWithIndividuals({
                household_name: householdName,
                address,
                center_id: Number(centerId),
                individuals: allIndividuals,
            });

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
                <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Add New Household
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Household Name *</Label>
                                <Input
                                    value={householdName}
                                    onChange={e => setHouseholdName(e.target.value)}
                                    placeholder="Enter household name"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Address *</Label>
                                <Input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Enter address"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Evacuation Center *</Label>
                                <Select
                                    value={centerId}
                                    onValueChange={setCenterId}
                                    disabled={!!defaultCenterId || centersLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={
                                                centersLoading
                                                    ? "Loading centers..."
                                                    : "Select a center"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {centers.map(center => (
                                            <SelectItem
                                                key={center.center_id}
                                                value={String(center.center_id)}
                                            >
                                                {center.center_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <Label className="text-lg font-semibold">Household Head *</Label>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">First Name</Label>
                                    <Input
                                        value={headFirstName}
                                        onChange={e => setHeadFirstName(e.target.value)}
                                        placeholder="Enter first name"
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Last Name</Label>
                                    <Input
                                        value={headLastName}
                                        onChange={e => setHeadLastName(e.target.value)}
                                        placeholder="Enter last name"
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !headDob && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {headDob ? format(headDob, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={headDob}
                                                onSelect={setHeadDob}
                                                disabled={date => date > new Date()}
                                                captionLayout="dropdown"
                                                fromYear={1900}
                                                toYear={new Date().getFullYear()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Gender</Label>
                                    <Select value={headGender} onValueChange={setHeadGender}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold">Additional Members</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsIndividualModalOpen(true)}
                                    className="gap-2"
                                >
                                    Add Member
                                </Button>
                            </div>

                            {individuals.length > 0 ? (
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="whitespace-nowrap">
                                                        First Name
                                                    </TableHead>
                                                    <TableHead className="whitespace-nowrap">
                                                        Last Name
                                                    </TableHead>
                                                    <TableHead className="whitespace-nowrap">
                                                        Date of Birth
                                                    </TableHead>
                                                    <TableHead className="whitespace-nowrap">
                                                        Gender
                                                    </TableHead>
                                                    <TableHead className="whitespace-nowrap">
                                                        Relationship
                                                    </TableHead>
                                                    <TableHead className="whitespace-nowrap w-[80px]">
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {individuals.map((ind, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium whitespace-nowrap">
                                                            {ind.first_name}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {ind.last_name}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {ind.date_of_birth
                                                                ? format(
                                                                      new Date(ind.date_of_birth),
                                                                      "PPP"
                                                                  )
                                                                : "N/A"}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {ind.gender || "N/A"}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {ind.relationship_to_head}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleRemoveIndividual(index)
                                                                }
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                                    No additional members added yet. Click "Add Member" to include
                                    other household members.
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || centersLoading}
                            className="bg-blue-600 hover:bg-blue-700 px-6"
                        >
                            {isSubmitting ? "Adding..." : "Add Household"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
