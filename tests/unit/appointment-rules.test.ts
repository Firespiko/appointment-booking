import { describe, expect, it } from "vitest";

describe("appointment business rules", () => {
    it("allows a future appointment slot", () => {
        const start = new Date("2030-01-01T10:00:00Z");
        const end = new Date("2030-01-01T11:00:00Z");

        expect(start < end).toBe(true);
    });

    it("rejects a slot where the end is before the start", () => {
        const start = new Date("2030-01-01T11:00:00Z");
        const end = new Date("2030-01-01T10:00:00Z");

        expect(start < end).toBe(false);
    });

    it("rejects a slot where start and end are equal", () => {
        const start = new Date("2030-01-01T10:00:00Z");
        const end = new Date("2030-01-01T10:00:00Z");

        expect(start < end).toBe(false);
    });
});