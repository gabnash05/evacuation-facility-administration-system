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
import type { UpdateHouseholdData } from "@/types/households";

interface EditHouseholdModalProps {
    householdId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isCenterAdminView?: boolean;
}

export function EditHouseholdModal({
    householdId,
    isOpen,
    onClose,
    onSuccess,
    isCenterAdminView = false,
}: EditHouseholdModalProps) {
    const { updateHousehold, getHouseholdDetails, getHouseholdIndividuals } = useHouseholdStore();
    const { centers, fetchAllCenters, loading: centersLoading } = useEvacuationCenterStore();

    const [householdName, setHouseholdName] = useState("");
    const [address, setAddress] = useState("");
    const [centerId, setCenterId] = useState<string | undefined>(undefined);
    const [headFirstName, setHeadFirstName] = useState("");
    const [headLastName, setHeadLastName] = useState("");
    const [headDob, setHeadDob] = useState<Date>();
    const [headGender, setHeadGender] = useState("Male");
    const [individuals, setIndividuals] = useState<Omit<CreateIndividualData, "household_id">[]>(
        []
    );
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && householdId) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // Only fetch the full list of centers if it's the City Admin view
                    if (!isCenterAdminView) {
                        await fetchAllCenters();
                    }
                    const [household, individualsResult] = await Promise.all([
                        getHouseholdDetails(householdId),
                        getHouseholdIndividuals(householdId),
                    ]);
                    setHouseholdName(household.household_name);
                    setAddress(household.address || "");
                    setCenterId(String(household.center_id));
                    const headIndividual = individualsResult.find(
                        (ind: any) => ind.individual_id === household.household_head_id
                    );
                    if (headIndividual) {
                        setHeadFirstName(headIndividual.first_name);
                        setHeadLastName(headIndividual.last_name);
                        setHeadGender(headIndividual.gender || "Male");
                        if (headIndividual.date_of_birth) {
                            setHeadDob(new Date(headIndividual.date_of_birth));
                        }
                    }
                    const otherIndividuals = individualsResult.filter(
                        (ind: any) => ind.individual_id !== household.household_head_id
                    );
                    const formattedIndividuals = otherIndividuals.map((ind: any) => ({
                        individual_id: ind.individual_id,
                        first_name: ind.first_name,
                        last_name: ind.last_name,
                        date_of_birth: ind.date_of_birth || undefined,
                        gender: ind.gender || undefined,
                        relationship_to_head: ind.relationship_to_head,
                    }));
                    setIndividuals(formattedIndividuals);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [
        isOpen,
        householdId,
        getHouseholdDetails,
        getHouseholdIndividuals,
        fetchAllCenters,
        isCenterAdminView,
    ]);

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
                "Error: The primary household head is defined above. Use that section for the head."
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
            setError("Household head's first and last name are required.");
            return;
        }
        if (!householdName || !address || !centerId) {
            setError("Household Name, Address, and Evacuation Center are required.");
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (headDob && headDob > today) {
            setError("Head's date of birth cannot be in the future.");
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
            const updateData: UpdateHouseholdData = {
                household_name: householdName,
                address,
                center_id: Number(centerId),
                individuals: [
                    {
                        first_name: headFirstName,
                        last_name: headLastName,
                        date_of_birth: headDob ? format(headDob, "yyyy-MM-dd") : undefined,
                        gender: headGender || undefined,
                        relationship_to_head: "Head",
                    },
                    ...individuals,
                ],
            };
            await updateHousehold(householdId!, updateData);
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
                        <DialogTitle className="text-lg font-semibold">Edit Household</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        {isLoading ? (
                            <div className="py-8 text-center text-muted-foreground">
                                Loading household data...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            Household Name *
                                        </Label>
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
                                        <Label className="text-sm font-medium">
                                            Evacuation Center *
                                        </Label>
                                        <Select
                                            value={centerId}
                                            onValueChange={setCenterId}
                                            disabled={isCenterAdminView || centersLoading}
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
                                    <Label className="text-lg font-semibold">
                                        Household Head *
                                    </Label>
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                First Name
                                            </Label>
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
                                            <Label className="text-sm font-medium">
                                                Date of Birth
                                            </Label>
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
                                                        {headDob
                                                            ? format(headDob, "PPP")
                                                            : "Pick a date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
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
                                            <Select
                                                value={headGender}
                                                onValueChange={setHeadGender}
                                            >
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
                                        <Label className="text-lg font-semibold">
                                            Additional Members
                                        </Label>
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
                                                            <TableHead>First Name</TableHead>
                                                            <TableHead>Last Name</TableHead>
                                                            <TableHead>Date of Birth</TableHead>
                                                            <TableHead>Gender</TableHead>
                                                            <TableHead>Relationship</TableHead>
                                                            <TableHead>Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {individuals.map((ind, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>
                                                                    {ind.first_name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {ind.last_name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {ind.date_of_birth
                                                                        ? format(
                                                                              new Date(
                                                                                  ind.date_of_birth
                                                                              ),
                                                                              "PPP"
                                                                          )
                                                                        : "N/A"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {ind.gender || "N/A"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {ind.relationship_to_head}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            handleRemoveIndividual(
                                                                                index
                                                                            )
                                                                        }
                                                                        className="h-8 w-8 text-destructive"
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
                                            No additional members added yet.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || centersLoading || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 px-6"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
