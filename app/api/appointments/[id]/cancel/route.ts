import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth/session";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    request: Request,
    context: RouteContext,
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

        const { id } = await context.params;

        const [appointment] = await db
            .select({
                id: appointments.id,
                status: appointments.status,
                slotStartTime: appointmentSlots.startTime,
            })
            .from(appointments)
            .innerJoin(
                appointmentSlots,
                eq(appointments.slotId, appointmentSlots.id),
            )
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.userId, user.id),
                ),
            )
            .limit(1);

        if (!appointment) {
            return NextResponse.json(
                {
                    error: {
                        code: "APPOINTMENT_NOT_FOUND",
                        message: "Appointment not found.",
                    },
                },
                { status: 404 },
            );
        }

        if (appointment.status === "CANCELLED") {
            return NextResponse.json(
                {
                    error: {
                        code: "ALREADY_CANCELLED",
                        message: "This appointment is already cancelled.",
                    },
                },
                { status: 409 },
            );
        }

        if (appointment.slotStartTime <= new Date()) {
            return NextResponse.json(
                {
                    error: {
                        code: "APPOINTMENT_STARTED",
                        message: "This appointment can no longer be cancelled.",
                    },
                },
                { status: 409 },
            );
        }

        const [cancelled] = await db
            .update(appointments)
            .set({
                status: "CANCELLED",
                cancelledAt: new Date(),
            })
            .where(
                and(
                    eq(appointments.id, appointment.id),
                    eq(appointments.userId, user.id),
                    eq(appointments.status, "BOOKED"),
                ),
            )
            .returning();

        if (!cancelled) {
            return NextResponse.json(
                {
                    error: {
                        code: "CANCELLATION_CONFLICT",
                        message: "The appointment could not be cancelled.",
                    },
                },
                { status: 409 },
            );
        }

        return NextResponse.json({
            appointment: cancelled,
        });
    } catch (error) {
        console.error("Failed to cancel appointment:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to cancel appointment.",
                },
            },
            { status: 500 },
        );
    }
}