"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AidAllocationFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    centers?: Array<{ id: number; name: string }>;
    initialData?: any;
    title?: string;
    submitText?: string;
}

export function AidAllocationForm({
    isOpen,
    onClose,
    onSubmit,
    centers = [],
    initialData = {},
    title = "Allocate Aid",
    submitText = "Allocate Aid",
}: AidAllocationFormProps) {
    const [formData, setFormData] = useState({
        center_id: initialData.center_id || "",
        relief_type: initialData.relief_type || "",
        quantity: initialData.quantity || "",
        distribution_rule: initialData.distribution_rule || "per_individual",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.center_id) newErrors.center_id = "Evacuation center is required";
        if (!formData.relief_type.trim()) newErrors.relief_type = "Relief type is required";
        if (!formData.quantity || Number(formData.quantity) <= 0) 
            newErrors.quantity = "Quantity must be greater than 0";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit({
                ...formData,
                quantity: Number(formData.quantity),
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            center_id: "",
            relief_type: "",
            quantity: "",
            distribution_rule: "per_individual",
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* Active Evaluation Center */}
                    <div className="space-y-2">
                        <Label htmlFor="center_id" className="font-semibold">
                            Active Evaluation Center
                        </Label>
                        <Select
                            value={formData.center_id}
                            onValueChange={(value) => handleChange("center_id", value)}
                        >
                            <SelectTrigger className={errors.center_id ? "border-destructive" : ""}>
                                <SelectValue placeholder="Select center" />
                            </SelectTrigger>
                            <SelectContent>
                                {centers.map(center => (
                                    <SelectItem key={center.id} value={center.id.toString()}>
                                        {center.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.center_id && (
                            <p className="text-sm text-destructive">{errors.center_id}</p>
                        )}
                    </div>

                    {/* Relief Type */}
                    <div className="space-y-2">
                        <Label htmlFor="relief_type" className="font-semibold">
                            Relief Type
                        </Label>
                        <Input
                            id="relief_type"
                            value={formData.relief_type}
                            onChange={(e) => handleChange("relief_type", e.target.value)}
                            className={errors.relief_type ? "border-destructive" : ""}
                            placeholder="e.g., Food Packs"
                        />
                        {errors.relief_type && (
                            <p className="text-sm text-destructive">{errors.relief_type}</p>
                        )}
                    </div>

                    {/* Quantity to Allocate */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="font-semibold">
                            Quantity to Allocate
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => handleChange("quantity", e.target.value)}
                            className={errors.quantity ? "border-destructive" : ""}
                            placeholder="e.g., 450"
                        />
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity}</p>
                        )}
                    </div>

                    {/* Distribution Rule - Custom Radio Buttons */}
                    <div className="space-y-3">
                        <Label className="font-semibold block">Distribution Rule</Label>
                        <div className="flex space-x-6">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_individual"
                                    name="distribution_rule"
                                    value="per_individual"
                                    checked={formData.distribution_rule === "per_individual"}
                                    onChange={(e) => handleChange("distribution_rule", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <Label 
                                    htmlFor="per_individual" 
                                    className="ml-2 cursor-pointer select-none"
                                >
                                    Per Individual
                                </Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="per_household"
                                    name="distribution_rule"
                                    value="per_household"
                                    checked={formData.distribution_rule === "per_household"}
                                    onChange={(e) => handleChange("distribution_rule", e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <Label 
                                    htmlFor="per_household" 
                                    className="ml-2 cursor-pointer select-none"
                                >
                                    Per Household
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}