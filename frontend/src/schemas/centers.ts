import { z } from "zod";

export const createCenterSchema = z.object({
    center_name: z.string().min(1, "Center name is required").max(255, "Center name is too long"),
    address: z.string().min(1, "Address is required").max(500, "Address is too long"),
    capacity: z.number().min(1, "Capacity must be at least 1").max(10000, "Capacity is too high"),
    latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
    longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
    current_occupancy: z
        .number()
        .min(0, "Current occupancy cannot be negative")
        .refine(val => val >= 0, "Current occupancy cannot be negative")
        .optional()
        .default(0),
    status: z.enum(["active", "inactive", "closed", "open"]).default("active"),
});

export const updateCenterSchema = z.object({
    center_name: z
        .string()
        .min(1, "Center name is required")
        .max(255, "Center name is too long")
        .optional(),
    address: z.string().min(1, "Address is required").max(500, "Address is too long").optional(),
    latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
    longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
    capacity: z
        .number()
        .min(1, "Capacity must be at least 1")
        .max(10000, "Capacity is too high")
        .optional(),
    current_occupancy: z
        .number()
        .min(0, "Current occupancy cannot be negative")
        .refine(val => val >= 0, "Current occupancy cannot be negative")
        .optional(),
    status: z.enum(["active", "inactive", "closed", "open"]).optional(),
});

export type CreateCenterFormData = z.infer<typeof createCenterSchema>;
export type UpdateCenterFormData = z.infer<typeof updateCenterSchema>;
