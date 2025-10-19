import { z } from "zod";

export const createHouseholdSchema = z.object({
    household_name: z.string().min(1, "Household name is required"),
    address: z.string().min(1, "Address is required"),
    household_head_id: z.number().optional(), // Optional for initial creation
});

export const updateHouseholdSchema = z.object({
    household_name: z.string().min(1, "Household name is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    household_head_id: z.number().optional(),
});

export type CreateHouseholdFormData = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdFormData = z.infer<typeof updateHouseholdSchema>;
