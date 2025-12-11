// FILE NAME: src/components/features/household/HouseholdDetailsModal.tsx

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useHouseholdStore } from "@/store/householdStore";
import type { Household } from "@/types/households";
import type { Individual } from "@/types/individual";
import { format } from "date-fns";

interface HouseholdDetailsModalProps {
    householdId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export function HouseholdDetailsModal({
    householdId,
    isOpen,
    onClose,
}: HouseholdDetailsModalProps) {
    const { getHouseholdDetails, getHouseholdIndividuals } = useHouseholdStore();
    
    const [household, setHousehold] = useState<Household | null>(null);
    const [individuals, setIndividuals] = useState<Individual[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && householdId) {
            const fetchHouseholdData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const [householdData, individualsData] = await Promise.all([
                        getHouseholdDetails(householdId),
                        getHouseholdIndividuals(householdId),
                    ]);
                    
                    setHousehold(householdData);
                    setIndividuals(individualsData);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchHouseholdData();
        }
    }, [isOpen, householdId, getHouseholdDetails, getHouseholdIndividuals]);

    const resetForm = () => {
        setHousehold(null);
        setIndividuals([]);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const getHouseholdHead = () => {
        if (!household?.household_head_id) return null;
        return individuals.find(ind => ind.individual_id === household.household_head_id);
    };

    const getOtherMembers = () => {
        if (!household?.household_head_id) return individuals;
        return individuals.filter(ind => ind.individual_id !== household.household_head_id);
    };

    // Function to calculate age from date of birth
    const calculateAge = (dateOfBirth: string | undefined): string => {
        if (!dateOfBirth) return "N/A";
        
        try {
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            
            // Check if the date is valid
            if (isNaN(birthDate.getTime())) return "Invalid Date";
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDifference = today.getMonth() - birthDate.getMonth();
            
            // Adjust age if birthday hasn't occurred this year yet
            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age.toString();
        } catch {
            return "N/A";
        }
    };

    // Function to format date (kept in case you need it elsewhere)
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "PPP");
        } catch {
            return "Invalid Date";
        }
    };

    const householdHead = getHouseholdHead();
    const otherMembers = getOtherMembers();

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Household Details
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Loading household data...
                        </div>
                    ) : household ? (
                        <>
                            {/* Household Information Section */}
                            <div className="border-b pb-6 space-y-4">
                                <Label className="text-lg font-semibold">Household Information</Label>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Household Name
                                        </Label>
                                        <Input
                                            value={household.household_name}
                                            readOnly
                                            className="w-full bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Evacuation Center
                                        </Label>
                                        <Input
                                            value={household.center?.center_name || "Unknown center"}
                                            readOnly
                                            className="w-full bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Address
                                        </Label>
                                        <Input
                                            value={household.address || "No address provided"}
                                            readOnly
                                            className="w-full bg-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Household Head Section */}
                            {householdHead && (
                                <div className="border-b pb-6 space-y-4">
                                    <Label className="text-lg font-semibold">Household Head</Label>
                                    <div className="border border-border rounded-lg p-4 bg-card">
                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    First Name
                                                </Label>
                                                <div className="text-sm font-medium">
                                                    {householdHead.first_name}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    Last Name
                                                </Label>
                                                <div className="text-sm font-medium">
                                                    {householdHead.last_name}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    Age
                                                </Label>
                                                <div className="text-sm">
                                                    {calculateAge(householdHead.date_of_birth!)}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-muted-foreground">
                                                    Gender
                                                </Label>
                                                <div className="text-sm">
                                                    {householdHead.gender || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Members Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg font-semibold">
                                        Additional Members ({otherMembers.length})
                                    </Label>
                                </div>
                                
                                {otherMembers.length > 0 ? (
                                    <div className="border border-border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <Table className="min-w-full">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>First Name</TableHead>
                                                        <TableHead>Last Name</TableHead>
                                                        <TableHead>Age</TableHead>
                                                        <TableHead>Gender</TableHead>
                                                        <TableHead>Relationship</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {otherMembers.map((individual, index) => (
                                                        <TableRow 
                                                            key={individual.individual_id}
                                                            className={index % 2 === 1 ? "bg-muted/30" : ""}
                                                        >
                                                            <TableCell className="py-3">
                                                                {individual.first_name}
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                {individual.last_name}
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                {calculateAge(individual.date_of_birth!)}
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                {individual.gender || "N/A"}
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                {individual.relationship_to_head}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                                        No additional members in this household.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        !loading && (
                            <div className="py-8 text-center text-muted-foreground">
                                Household data not found.
                            </div>
                        )
                    )}
                </div>

                <div className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}