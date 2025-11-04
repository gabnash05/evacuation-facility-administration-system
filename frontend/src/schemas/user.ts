import { z } from "zod";

export const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["super_admin", "city_admin", "center_admin", "volunteer"]),
    center_id: z.number().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email("Invalid email address").optional(),
    role: z.enum(["super_admin", "city_admin", "center_admin", "volunteer"]).optional(),
    center_id: z.number().optional(),
    is_active: z.boolean().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;