import { NextResponse } from "next/server";
import { and, asc, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth/session";
import { createSlotSchema } from "@/src/features/slots/schemas/slot";


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

        const now = new Date();

        const slots = await db
            .select({
                id: appointmentSlots.id,
                startTime: appointmentSlots.startTime,
                endTime: appointmentSlots.endTime,
            })
            .from(appointmentSlots)
            .leftJoin(
                appointments,
                and(
                    eq(appointments.slotId, appointmentSlots.id),
                    eq(appointments.status, "BOOKED"),
                ),
            )
            .where(
                and(
                    gt(appointmentSlots.startTime, now),
                    isNull(appointments.id),
                ),
            )
            .orderBy(asc(appointmentSlots.startTime));

        return NextResponse.json({
            slots,
        });
    } catch (error) {
        console.error("Failed to fetch slots:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to load appointment slots.",
                },
            },
            { status: 500 },
        );
    }
}

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

        const body = await request.json();
        const result = createSlotSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid slot details.",
                        details: result.error.flatten().fieldErrors,
                    },
                },
                { status: 400 },
            );
        }

        const { startTime, endTime } = result.data;

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start <= new Date()) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_SLOT_TIME",
                        message: "Appointment slots must be in the future.",
                    },
                },
                { status: 400 },
            );
        }

        const [existingSlot] = await db
            .select({
                id: appointmentSlots.id,
            })
            .from(appointmentSlots)
            .where(
                and(
                    eq(appointmentSlots.startTime, start),
                    eq(appointmentSlots.endTime, end),
                ),
            )
            .limit(1);

        if (existingSlot) {
            return NextResponse.json(
                {
                    error: {
                        code: "SLOT_ALREADY_EXISTS",
                        message: "An appointment slot already exists at this time.",
                    },
                },
                { status: 409 },
            );
        }

        const [slot] = await db
            .insert(appointmentSlots)
            .values({
                id: crypto.randomUUID(),
                startTime: start,
                endTime: end,
                createdBy: user.id,
            })
            .returning();

        return NextResponse.json(
            {
                slot,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Failed to create slot:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to create appointment slot.",
                },
            },
            { status: 500 },
        );
    }
}