import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import type { User, UserRole } from "@/types/user";

const baseSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    role: z.enum(["super_admin", "city_admin", "center_admin", "volunteer"]),
    center_id: z.string().optional(),
});

const createUserSchema = baseSchema.extend({
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const updateUserSchema = baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});

const getFormSchema = (isEditMode: boolean) => (isEditMode ? updateUserSchema : createUserSchema).refine(
    data => !["center_admin", "volunteer"].includes(data.role) || !!data.center_id,
    { message: "An assigned center is required for this role.", path: ["center_id"] }
);

type UserFormData = z.infer<ReturnType<typeof getFormSchema>>;

interface AddEditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User | null; 
    currentUserRole?: UserRole;
}

export function AddEditUserModal({ isOpen, onClose, userToEdit, currentUserRole }: AddEditUserModalProps) {
    const { centers, fetchAllCenters } = useEvacuationCenterStore();
    const isEditMode = !!userToEdit;

    const availableRoles = useMemo(() => {
        if (currentUserRole === "super_admin") {
            return [ { value: "super_admin", label: "Super Admin" }, { value: "city_admin", label: "City Admin" }, { value: "center_admin", label: "Center Admin" }, { value: "volunteer", label: "Volunteer" }];
        }
        if (currentUserRole === "city_admin") {
            return [ { value: "center_admin", label: "Center Admin" }, { value: "volunteer", label: "Volunteer" }];
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
        resolver: zodResolver(getFormSchema(isEditMode)),
    });

    const selectedRole = watch("role");

    useEffect(() => {
        fetchAllCenters();
    }, [fetchAllCenters]);
    
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && userToEdit) {
                reset({
                    email: userToEdit.email,
                    role: userToEdit.role,
                    center_id: userToEdit.center_id ? String(userToEdit.center_id) : undefined,
                    password: "", 
                });
            } else {
                reset({
                    email: "",
                    password: "",
                    role: availableRoles.length > 0 ? availableRoles[0].value as UserFormData["role"] : "volunteer",
                    center_id: undefined,
                });
            }
        }
    }, [isOpen, isEditMode, userToEdit, reset, availableRoles]);

    const onSubmit = (data: UserFormData) => {
        // --- THIS IS A PLACEHOLDER ---
        if (isEditMode) {
            console.log("--- EDITING USER ---");
            console.log("User ID:", userToEdit?.user_id);
            console.log("Submitted Data:", data);
            alert(`(Placeholder) Pretending to update user: ${data.email}`);
        } else {
            console.log("--- ADDING NEW USER ---");
            console.log("Submitted Data:", data);
            alert(`(Placeholder) Pretending to create user: ${data.email}`);
        }
        onClose(); 
    };

    const isCenterRequired = useMemo(() => ["center_admin", "volunteer"].includes(selectedRole), [selectedRole]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Update the details for ${userToEdit?.email}.` : "Fill in the details to create a new user account."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <div className="col-span-3">
                            <Input id="email" {...register("email")} />
                            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <div className="col-span-3">
                            <Input id="password" type="password" {...register("password")} placeholder={isEditMode ? "Leave blank to keep current" : ""}/>
                            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <div className="col-span-3">
                            <Controller name="role" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map(role => (
                                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )} />
                            {errors.role && <p className="text-destructive text-sm mt-1">{errors.role.message}</p>}
                        </div>
                    </div>

                    {isCenterRequired && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="center_id" className="text-right">Center</Label>
                            <div className="col-span-3">
                                <Controller name="center_id" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={centers.length === 0}>
                                        <SelectTrigger><SelectValue placeholder="Assign a center" /></SelectTrigger>
                                        <SelectContent>
                                            {centers.map(center => (
                                                <SelectItem key={center.center_id} value={String(center.center_id)}>{center.center_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )} />
                                {errors.center_id && <p className="text-destructive text-sm mt-1">{errors.center_id.message}</p>}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isEditMode ? "Save Changes" : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}