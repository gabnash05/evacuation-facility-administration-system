import { z } from "zod";

export const createHouseholdSchema = z.object({
    household_name: z.string().min(1, "Household name is required"),
    address: z.string().min(1, "Address is required"),
    household_head_id: z.number().optional(), // Optional for initial creation
    center_id: z.number().min(1, "Evacuation center is required"),
    individuals: z.array(z.unknown()).min(1, "At least one household member is required"),
});

export const updateHouseholdSchema = z.object({
    household_name: z.string().min(1, "Household name is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    household_head_id: z.number().optional(),
});

export type CreateHouseholdFormData = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdFormData = z.infer<typeof updateHouseholdSchema>;
