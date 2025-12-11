import { z } from "zod";

export const GenderSchema = z.enum(["Male", "Female", "Other"]).nullable().optional();

export const AgeGroupSchema = z.enum(["Child", "Teen", "Adult", "Senior"]).nullable().optional();

export const StatsFilterSchema = z.object({
    gender: GenderSchema,
    age_group: AgeGroupSchema,
    center_id: z.number().nullable().optional(),
});

export type StatsFilterFormData = z.infer<typeof StatsFilterSchema>;

// Age group display labels with ranges
export const AGE_GROUP_LABELS: Record<string, string> = {
    Child: "Child (0-12)",
    Teen: "Teen (13-17)",
    Adult: "Adult (18-59)",
    Senior: "Senior (60+)",
};

// Gender display labels
export const GENDER_LABELS: Record<string, string> = {
    Male: "Male",
    Female: "Female",
    Other: "Other",
};