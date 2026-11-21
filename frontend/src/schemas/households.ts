import { z } from "zod";

export const createHouseholdSchema = z.object({
    household_name: z.string().min(1, "Household name is required"),
    address: z.string().min(1, "Address is required"),
    household_head_id: z.number().optional(), // Optional for initial creation
    center_id: z.number().min(1, "Evacuation center is required"),
    individuals: z.array(z.unknown()).min(1, "At least one household member is required"),
});

export const updateHouseholdSchema = z.object({
    household_name: z.string().min(3, "Household name must be at least 3 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    center_id: z.number().min(1, "Evacuation center is required"),
    household_head_id: z.number().optional(),
    individuals: z
        .array(
            z.object({
                individual_id: z.number().optional(),
                first_name: z.string().min(1, "First name is required"),
                last_name: z.string().min(1, "Last name is required"),
                date_of_birth: z.string().nullable().optional(),
                gender: z.enum(["Male", "Female", "Other"]).nullable().optional(),
                relationship_to_head: z.string().min(1, "Relationship is required"),
            })
        )
        .min(1, "At least one household member is required"),
});

export type CreateHouseholdFormData = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdFormData = z.infer<typeof updateHouseholdSchema>;
