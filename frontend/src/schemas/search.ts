import { z } from "zod";

export const searchFilterSchema = z.object({
    search: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

export const centerSearchSchema = searchFilterSchema.extend({
    status: z.enum(["active", "inactive", "closed"]).optional(),
});

export const eventSearchSchema = searchFilterSchema.extend({
    status: z.enum(["active", "resolved", "monitoring"]).optional(),
});

export const householdSearchSchema = searchFilterSchema.extend({
    center_id: z.number().optional(),
});

export type SearchFilterData = z.infer<typeof searchFilterSchema>;
export type CenterSearchData = z.infer<typeof centerSearchSchema>;
export type EventSearchData = z.infer<typeof eventSearchSchema>;
export type HouseholdSearchData = z.infer<typeof householdSearchSchema>;
