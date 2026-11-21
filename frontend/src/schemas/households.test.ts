import { describe, expect, it } from "vitest";

import { createHouseholdSchema, updateHouseholdSchema } from "./households";

describe("household schemas", () => {
    const base = {
        household_name: "Santos household",
        address: "Barangay One",
        center_id: 2,
        individuals: [{ first_name: "Ana" }],
    };

    it("accepts the required ownership and member fields used by the create workflow", () => {
        expect(createHouseholdSchema.parse(base)).toMatchObject({ center_id: 2 });
    });

    it("rejects creation without a center or household member", () => {
        expect(createHouseholdSchema.safeParse({ ...base, center_id: 0 }).success).toBe(false);
        expect(createHouseholdSchema.safeParse({ ...base, individuals: [] }).success).toBe(false);
    });

    it("requires the complete update payload accepted by the backend", () => {
        const update = {
            household_name: "Santos household",
            address: "Barangay One",
            center_id: 2,
            individuals: [
                {
                    individual_id: 9,
                    first_name: "Ana",
                    last_name: "Santos",
                    relationship_to_head: "Head",
                },
            ],
        };

        expect(updateHouseholdSchema.safeParse(update).success).toBe(true);
        expect(updateHouseholdSchema.safeParse({ ...update, center_id: 0 }).success).toBe(false);
        expect(updateHouseholdSchema.safeParse({ ...update, individuals: [] }).success).toBe(false);
    });
});
