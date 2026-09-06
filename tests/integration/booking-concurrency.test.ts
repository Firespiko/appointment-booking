import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
    users,
} from "@/src/db/schema";

describe("appointment booking concurrency", () => {
    it("prevents two active bookings for the same slot", async () => {
        const [admin] = await db
            .select()
            .from(users)
            .where(eq(users.email, "admin@example.com"))
            .limit(1);

        expect(admin).toBeDefined();

        if (!admin) {
            throw new Error("Seed admin user not found");
        }

        const [user] = await db
            .insert(users)
            .values({
                email: `test-${Date.now()}@example.com`,
                passwordHash: "test-only",
                role: "USER",
            })
            .returning();

        const [slot] = await db
            .insert(appointmentSlots)
            .values({
                startTime: new Date("2030-01-01T10:00:00Z"),
                endTime: new Date("2030-01-01T11:00:00Z"),
                createdBy: admin.id,
            })
            .returning();

        const firstBooking = await db
            .insert(appointments)
            .values({
                slotId: slot.id,
                userId: user.id,
                status: "BOOKED",
            })
            .returning();

        expect(firstBooking).toHaveLength(1);

        await expect(
            db
                .insert(appointments)
                .values({
                    slotId: slot.id,
                    userId: user.id,
                    status: "BOOKED",
                }),
        ).rejects.toThrow();

        const bookings = await db
            .select()
            .from(appointments)
            .where(eq(appointments.slotId, slot.id));

        expect(bookings).toHaveLength(1);
        expect(bookings[0].status).toBe("BOOKED");

        await db
            .delete(appointments)
            .where(eq(appointments.slotId, slot.id));

        await db
            .delete(appointmentSlots)
            .where(eq(appointmentSlots.id, slot.id));

        await db
            .delete(users)
            .where(eq(users.id, user.id));
    }, 15000);
});