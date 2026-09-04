import { describe, expect, it } from "vitest";

import { createCenterSchema, updateCenterSchema } from "./centers";

const validCenter = {
    center_name: "North Hall",
    address: "Barangay One",
    capacity: 100,
    latitude: 14.6,
    longitude: 121.0,
};

describe("center schemas", () => {
    it("defaults a valid new center to the backend-supported active status", () => {
        expect(createCenterSchema.parse(validCenter).status).toBe("active");
    });

    it("rejects statuses that the backend and database do not support", () => {
        expect(createCenterSchema.safeParse({ ...validCenter, status: "open" }).success).toBe(
            false
        );
        expect(updateCenterSchema.safeParse({ status: "open" }).success).toBe(false);
    });
});
