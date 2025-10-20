import { z } from "zod";

export const createCenterSchema = z.object({
    address: z.string().min(1, "Address is required"),
    capacity: z.number().min(1, "Capacity must be at least 1"),
    status: z.enum(["active", "inactive", "closed"]).default("active"),
});

export const updateCenterSchema = z.object({
    address: z.string().min(1, "Address is required").optional(),
    capacity: z.number().min(1, "Capacity must be at least 1").optional(),
    status: z.enum(["active", "inactive", "closed"]).optional(),
});

export type CreateCenterFormData = z.infer<typeof createCenterSchema>;
export type UpdateCenterFormData = z.infer<typeof updateCenterSchema>;
