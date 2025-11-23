import { z } from "zod";

// Schema for individual selection
export const TransferIndividualSelectionSchema = z.object({
    individual_ids: z
        .array(z.number())
        .min(1, "At least one individual must be selected")
        .max(50, "Cannot transfer more than 50 individuals at once"),
});

// Schema for transfer destination
export const TransferDestinationSchema = z.object({
    destination_type: z.enum(["center", "home", "hospital", "other"]),
    destination_center_id: z.number().optional(),
});

// Schema for transfer reason
export const TransferReasonSchema = z.object({
    reason: z.enum([
        "medical_emergency",
        "family_request",
        "center_capacity",
        "relocation",
        "safety_concerns",
        "special_needs",
        "other",
    ]),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Complete transfer form schema
export const TransferFormSchema = TransferIndividualSelectionSchema.merge(
    TransferDestinationSchema
).merge(TransferReasonSchema);

// Validation function with custom logic
export function validateTransferForm(data: any) {
    // First, validate with Zod
    const result = TransferFormSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
        };
    }

    // Custom validation: If destination_type is "center", destination_center_id is required
    if (result.data.destination_type === "center" && !result.data.destination_center_id) {
        return {
            success: false,
            errors: {
                destination_center_id: ["Evacuation center must be selected for center transfers"],
            },
        };
    }

    return {
        success: true,
        data: result.data,
    };
}

// Schema for search/filter params
export const TransferSearchParamsSchema = z.object({
    center_id: z.number().optional(),
    search: z.string().optional(),
    status: z.enum(["sick", "injured", "at_risk", "normal"]).optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

export type TransferFormData = z.infer<typeof TransferFormSchema>;
export type TransferSearchParams = z.infer<typeof TransferSearchParamsSchema>;