// frontend/src/components/features/user-management/AddUserModal.tsx

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/userStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import type { UserRole } from "@/types/user";

const formSchema = z
    .object({
        email: z.string().email({ message: "Please enter a valid email address." }),
        password: z.string().min(6, { message: "Password must be at least 6 characters." }),
        // --- THIS IS THE FIX ---
        // z.enum is required by default inside an object. The invalid options object has been removed.
        role: z.enum(["super_admin", "city_admin", "center_admin", "volunteer"]),
        // --- END OF FIX ---
        center_id: z.string().optional(),
    })
    .refine(
        data => {
            if (["center_admin", "volunteer"].includes(data.role) && !data.center_id) {
                return false;
            }
            return true;
        },
        {
            message: "An assigned center is required for this role.",
            path: ["center_id"],
        }
    );

type UserFormData = z.infer<typeof formSchema>;

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserRole?: UserRole;
}

export function AddUserModal({ isOpen, onClose, currentUserRole }: AddUserModalProps) {
    const { createUser, loading, error } = useUserStore();
    const { centers, fetchAllCenters } = useEvacuationCenterStore();

    const availableRoles = useMemo(() => {
        if (currentUserRole === "super_admin") {
            return [
                { value: "super_admin", label: "Super Admin" },
                { value: "city_admin", label: "City Admin" },
                { value: "center_admin", label: "Center Admin" },
                { value: "volunteer", label: "Volunteer" },
            ];
        }
        if (currentUserRole === "city_admin") {
            return [
                { value: "center_admin", label: "Center Admin" },
                { value: "volunteer", label: "Volunteer" },
            ];
        }
        return [{ value: "volunteer", label: "Volunteer" }];
    }, [currentUserRole]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<UserFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            role: availableRoles.length > 0 ? (availableRoles[0].value as UserFormData["role"]) : "volunteer",
            center_id: undefined,
        },
    });

    const selectedRole = watch("role");

    useEffect(() => {
        fetchAllCenters();
    }, [fetchAllCenters]);
    
    useEffect(() => {
        if (isOpen) {
            reset({
                email: "",
                password: "",
                role: availableRoles.length > 0 ? (availableRoles[0].value as UserFormData["role"]) : "volunteer",
                center_id: undefined,
            });
        }
    }, [isOpen, reset, availableRoles]);

    const onSubmit = async (data: UserFormData) => {
        try {
            const submissionData = {
                ...data,
                center_id: data.center_id ? parseInt(data.center_id, 10) : undefined,
            };
            await createUser(submissionData);
            onClose();
        } catch (err) {
            console.error("Submission failed:", err);
        }
    };

    const isCenterRequired = useMemo(
        () => ["center_admin", "volunteer"].includes(selectedRole),
        [selectedRole]
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new user account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <div className="col-span-3">
                            <Input id="email" {...register("email")} />
                            {errors.email && (
                                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <div className="col-span-3">
                            <Input id="password" type="password" {...register("password")} />
                            {errors.password && (
                                <p className="text-destructive text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <div className="col-span-3">
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map(role => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role && (
                                <p className="text-destructive text-sm mt-1">{errors.role.message}</p>
                            )}
                        </div>
                    </div>

                    {isCenterRequired && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="center_id" className="text-right">
                                Center
                            </Label>
                            <div className="col-span-3">
                                <Controller
                                    name="center_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={centers.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Assign a center" />
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
                                    )}
                                />
                                {errors.center_id && (
                                    <p className="text-destructive text-sm mt-1">
                                        {errors.center_id.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {error && <p className="text-destructive text-sm col-span-4 text-center">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || loading}>
                            {loading ? "Saving..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}