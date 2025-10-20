import { z } from "zod";

export const createEventSchema = z.object({
    event_type: z.string().min(1, "Event type is required"),
    date_declared: z.string().min(1, "Declaration date is required"),
    end_date: z.string().optional().nullable(),
    status: z.enum(["active", "resolved", "monitoring"]).default("active"),
});

export const updateEventSchema = z.object({
    event_type: z.string().min(1, "Event type is required").optional(),
    date_declared: z.string().min(1, "Declaration date is required").optional(),
    end_date: z.string().optional().nullable(),
    status: z.enum(["active", "resolved", "monitoring"]).optional(),
});

export const linkCenterToEventSchema = z.object({
    center_id: z.number().min(1, "Center ID is required"),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;
export type LinkCenterToEventFormData = z.infer<typeof linkCenterToEventSchema>;
