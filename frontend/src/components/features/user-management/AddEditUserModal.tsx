import { useEffect, useMemo, useState } from "react";
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
import { useUserStore } from "@/store/userStore";
import { useAuthStore } from "@/store/authStore";

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
    onSuccess?: (message: string) => void;
}

export function AddEditUserModal({ isOpen, onClose, userToEdit, currentUserRole, onSuccess }: AddEditUserModalProps) {
    const { centers, fetchAllCenters } = useEvacuationCenterStore();
    const { user: currentUser } = useAuthStore();
    const isEditMode = !!userToEdit;

    // Check if current user is center admin
    const isCenterAdmin = currentUserRole === "center_admin";
    const userCenterId = currentUser?.center_id;

    // Logic to determine which roles are visible in the dropdown
    const availableRoles = useMemo(() => {
        if (currentUserRole === "super_admin") {
            return [
                { value: "super_admin", label: "Super Admin" },
                { value: "city_admin", label: "City Admin" },
                { value: "center_admin", label: "Center Admin" },
                { value: "volunteer", label: "Volunteer" }
            ];
        }
        if (currentUserRole === "city_admin") {
            return [
                { value: "center_admin", label: "Center Admin" },
                { value: "volunteer", label: "Volunteer" }
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
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<UserFormData>({
        resolver: zodResolver(getFormSchema(isEditMode)),
    });

    const selectedRole = watch("role");
    const isCenterRequired = useMemo(() => ["center_admin", "volunteer"].includes(selectedRole), [selectedRole]);
    const isCenterFieldLocked = isCenterAdmin && userCenterId; // Center field is locked for center admins

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
                // For center admin creating new user, auto-set their center
                const defaultCenterId = isCenterAdmin && userCenterId ? String(userCenterId) : undefined;
                
                reset({
                    email: "",
                    password: "",
                    role: availableRoles.length > 0 ? availableRoles[0].value as UserFormData["role"] : "volunteer",
                    center_id: defaultCenterId,
                });
            }
        }
    }, [isOpen, isEditMode, userToEdit, reset, availableRoles, isCenterAdmin, userCenterId]);

    // Auto-set center when role changes for center admin
    useEffect(() => {
        if (isCenterAdmin && userCenterId && isCenterRequired) {
            setValue("center_id", String(userCenterId));
        }
    }, [selectedRole, isCenterAdmin, userCenterId, setValue, isCenterRequired]);

    const { createUser, updateUser } = useUserStore();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const onSubmit = async (data: UserFormData) => {
        setSubmitError(null);
        
        const payload: any = {
            email: data.email,
            role: data.role,
        };

        // Determine if the selected role requires a center
        const roleRequiresCenter = ["center_admin", "volunteer"].includes(data.role);

        if (isCenterAdmin && userCenterId) {
            // Case 1: Center Admin (locked to their center)
            payload.center_id = userCenterId;
        } else if (roleRequiresCenter) {
            // Case 2: Role requires center (Center Admin / Volunteer)
            if (data.center_id && data.center_id !== "") {
                const n = Number(data.center_id);
                payload.center_id = Number.isFinite(n) ? n : data.center_id;
            } else {
                payload.center_id = undefined;
            }
        } else {
            // Case 3: Role forbids center (Super Admin / City Admin)
            // Explicitly set to null to clear any existing association in the database
            payload.center_id = null;
        }

        if (data.password && data.password !== "") {
            payload.password = data.password;
        }

        try {
            if (isEditMode && userToEdit) {
                await updateUser(userToEdit.user_id, payload);
                if (onSuccess) onSuccess("User updated successfully");
            } else {
                await createUser(payload);
                if (onSuccess) onSuccess("User created successfully");
            }
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save user";
            setSubmitError(msg);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Update the details for ${userToEdit?.email}.` : "Fill in the details to create a new user account."}
                        {isCenterFieldLocked && !isEditMode && (
                            <div className="mt-2 text-sm text-blue-600">
                                Users will be automatically assigned to your evacuation center.
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {submitError && (
                        <div className="bg-destructive/10 text-destructive p-2 rounded">
                            <span className="text-sm">{submitError}</span>
                        </div>
                    )}
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
                                {isCenterFieldLocked ? (
                                    // Display only mode for center admin
                                    <div className="flex items-center h-10 px-3 py-2 text-sm border border-input rounded-md bg-muted">
                                        {centers.find(center => center.center_id === userCenterId)?.center_name || "Your Center"}
                                    </div>
                                ) : (
                                    // Select mode for other roles
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
                                )}
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