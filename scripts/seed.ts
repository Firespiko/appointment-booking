import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, appointmentSlots } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function seed() {
    const email = "admin@example.com";
    const password = "Admin123!";

    const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    let adminId: string;

    if (existing.length > 0) {
        adminId = existing[0].id;
    } else {
        const passwordHash = await hashPassword(password);

        const [admin] = await db
            .insert(users)
            .values({
                id: crypto.randomUUID(),
                email,
                passwordHash,
                role: "ADMIN",
            })
            .returning({ id: users.id });

        adminId = admin.id;
    }

    const existingSlots = await db
        .select({ id: appointmentSlots.id })
        .from(appointmentSlots)
        .limit(1);

    if (existingSlots.length === 0) {
        const now = new Date();

        const slots = [1, 2, 3, 4].map((daysAhead, index) => {
            const startTime = new Date(now);

            startTime.setDate(startTime.getDate() + daysAhead);
            startTime.setHours(10 + index, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);

            return {
                id: crypto.randomUUID(),
                startTime,
                endTime,
                createdBy: adminId,
            };
        });

        await db.insert(appointmentSlots).values(slots);
    }

    console.log("Seed complete.");
    console.log(`Admin email: ${email}`);
    console.log(`Admin password: ${password}`);
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });