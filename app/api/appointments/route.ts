import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth/session";
import { createAppointmentSchema } from "@/src/features/appointments/schemas/appointment";

export async function POST(request: Request) {
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

        const body = await request.json();

        const result = createAppointmentSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid appointment details.",
                        details: result.error.flatten().fieldErrors,
                    },
                },
                { status: 400 },
            );
        }

        const { slotId } = result.data;

        const [slot] = await db
            .select()
            .from(appointmentSlots)
            .where(
                and(
                    eq(appointmentSlots.id, slotId),
                    gt(appointmentSlots.startTime, new Date()),
                ),
            )
            .limit(1);

        if (!slot) {
            return NextResponse.json(
                {
                    error: {
                        code: "SLOT_NOT_FOUND",
                        message: "This appointment slot does not exist or has passed.",
                    },
                },
                { status: 404 },
            );
        }

        try {
            const [appointment] = await db
                .insert(appointments)
                .values({
                    id: crypto.randomUUID(),
                    slotId,
                    userId: user.id,
                    status: "BOOKED",
                })
                .returning();

            return NextResponse.json(
                {
                    appointment,
                },
                { status: 201 },
            );
        } catch (error) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "23505"
            ) {
                return NextResponse.json(
                    {
                        error: {
                            code: "SLOT_ALREADY_BOOKED",
                            message:
                                "This slot is no longer available. Someone else booked it just before you.",
                        },
                    },
                    { status: 409 },
                );
            }

            throw error;
        }
    } catch (error) {
        console.error("Failed to book appointment:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to book appointment.",
                },
            },
            { status: 500 },
        );
    }
}

export async function GET() {
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

        const results = await db
            .select({
                id: appointments.id,
                status: appointments.status,
                createdAt: appointments.createdAt,
                cancelledAt: appointments.cancelledAt,
                slot: {
                    id: appointmentSlots.id,
                    startTime: appointmentSlots.startTime,
                    endTime: appointmentSlots.endTime,
                },
            })
            .from(appointments)
            .innerJoin(
                appointmentSlots,
                eq(appointments.slotId, appointmentSlots.id),
            )
            .where(eq(appointments.userId, user.id));

        return NextResponse.json({
            appointments: results,
        });
    } catch (error) {
        console.error("Failed to fetch appointments:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to load appointments.",
                },
            },
            { status: 500 },
        );
    }
}