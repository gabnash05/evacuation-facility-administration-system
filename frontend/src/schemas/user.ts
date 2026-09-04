import { z } from "zod";

const roleSchema = z.enum(["super_admin", "city_admin", "center_admin", "volunteer"]);
const centerIdSchema = z.number().min(1, "Center ID must be positive").nullable().optional();
const centerScopedRoles = new Set(["center_admin", "volunteer"]);

function validateRoleCenter(
    data: { role?: z.infer<typeof roleSchema>; center_id?: number | null },
    context: z.RefinementCtx
) {
    if (!data.role) return;

    if (centerScopedRoles.has(data.role) && !data.center_id) {
        context.addIssue({
            code: "custom",
            path: ["center_id"],
            message: "Center ID is required for center administrators and volunteers",
        });
    }

    if (
        !centerScopedRoles.has(data.role) &&
        data.center_id !== undefined &&
        data.center_id !== null
    ) {
        context.addIssue({
            code: "custom",
            path: ["center_id"],
            message: "Global administrator roles cannot be assigned to a center",
        });
    }
}

export const createUserSchema = z
    .object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: roleSchema,
        center_id: centerIdSchema,
    })
    .superRefine(validateRoleCenter);

export const updateUserSchema = z
    .object({
        email: z.string().email("Invalid email address").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        role: roleSchema.optional(),
        center_id: centerIdSchema,
        is_active: z.boolean().optional(),
    })
    .superRefine(validateRoleCenter);

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
