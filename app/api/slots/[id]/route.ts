import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth/session";

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                {
                    error: {
                        code: "UNAUTHENTICATED",
                        message: "You must be logged in.",
                    },
                },
                { status: 401 },
            );
        }

        if (user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    error: {
                        code: "FORBIDDEN",
                        message: "Admin access required.",
                    },
                },
                { status: 403 },
            );
        }

        const { id } = await context.params;

        const [slot] = await db
            .select({
                id: appointmentSlots.id,
                createdBy: appointmentSlots.createdBy,
            })
            .from(appointmentSlots)
            .where(
                and(
                    eq(appointmentSlots.id, id),
                    eq(appointmentSlots.createdBy, user.id),
                ),
            )
            .limit(1);

        if (!slot) {
            return NextResponse.json(
                {
                    error: {
                        code: "SLOT_NOT_FOUND",
                        message: "Appointment slot not found.",
                    },
                },
                { status: 404 },
            );
        }

        const [activeAppointment] = await db
            .select({
                id: appointments.id,
            })
            .from(appointments)
            .where(
                and(
                    eq(appointments.slotId, id),
                    eq(appointments.status, "BOOKED"),
                ),
            )
            .limit(1);

        if (activeAppointment) {
            return NextResponse.json(
                {
                    error: {
                        code: "SLOT_HAS_APPOINTMENT",
                        message:
                            "This slot has an active appointment and cannot be deleted.",
                    },
                },
                { status: 409 },
            );
        }

        await db
            .delete(appointmentSlots)
            .where(eq(appointmentSlots.id, id));

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Failed to delete appointment slot:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to delete appointment slot.",
                },
            },
            { status: 500 },
        );
    }
}