import { describe, expect, it } from "vitest";

import { createIndividualSchema, updateIndividualSchema } from "./individuals";

describe("individual schemas", () => {
    it("matches the API contract for an individual creation payload", () => {
        expect(
            createIndividualSchema.parse({
                first_name: "Ana",
                last_name: "Santos",
                gender: "Female",
                relationship_to_head: "child",
                household_id: 4,
            })
        ).toMatchObject({ household_id: 4, gender: "Female" });
    });

    it("requires a positive household identifier and title-case gender values", () => {
        const base = {
            first_name: "Ana",
            last_name: "Santos",
            relationship_to_head: "child",
        };

        expect(createIndividualSchema.safeParse({ ...base, household_id: 0 }).success).toBe(false);
        expect(updateIndividualSchema.safeParse({ gender: "female" }).success).toBe(false);
    });
});
