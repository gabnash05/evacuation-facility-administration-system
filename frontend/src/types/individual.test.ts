import { describe, expectTypeOf, it } from "vitest";

import type { Individual, IndividualFilterParams, IndividualsResponse } from "./individual";

describe("individual contracts", () => {
    it("keeps canonical individual identity, household ownership, and pagination fields typed", () => {
        expectTypeOf<Individual>().toMatchTypeOf<{
            individual_id: number;
            household_id: number;
            current_status: string;
        }>();
        expectTypeOf<IndividualFilterParams>().toMatchTypeOf<{
            center_id?: number;
            household_id?: number;
        }>();
        expectTypeOf<IndividualsResponse>().toMatchTypeOf<{
            data: { results: Individual[]; pagination: { current_page: number } };
        }>();
    });
});
