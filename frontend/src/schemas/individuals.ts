import { z } from "zod";

export const createIndividualSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    date_of_birth: z.string().datetime(),
    gender: z.enum(["male", "female", "other"]),
    relationship_to_head: z.enum(["head", "spouse", "child", "parent", "sibling", "other"]),
});

export const updateIndividualSchema = z.object({
    first_name: z.string().min(1, "First name is required").optional(),
    last_name: z.string().min(1, "Last name is required").optional(),
    date_of_birth: z.string().min(1, "Date of birth is required").optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    relationship_to_head: z
        .enum(["head", "spouse", "child", "parent", "sibling", "other"])
        .optional(),
});

export type CreateIndividualFormData = z.infer<typeof createIndividualSchema>;
export type UpdateIndividualFormData = z.infer<typeof updateIndividualSchema>;
