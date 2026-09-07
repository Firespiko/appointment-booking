import { NextResponse } from "next/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/src/db/client";
import {
    appointmentSlots,
    appointments,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth/session";

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

        const slots = await db
            .select({
                id: appointmentSlots.id,
                startTime: appointmentSlots.startTime,
                endTime: appointmentSlots.endTime,
                isBooked: sql<boolean>`
                    COALESCE(
                        BOOL_OR(${appointments.status} = 'BOOKED'),
                        false
                    )
                `,
            })
            .from(appointmentSlots)
            .leftJoin(
                appointments,
                eq(appointments.slotId, appointmentSlots.id),
            )
            .where(
                and(
                    eq(appointmentSlots.createdBy, user.id),
                    gt(appointmentSlots.startTime, new Date()),
                ),
            )
            .groupBy(
                appointmentSlots.id,
                appointmentSlots.startTime,
                appointmentSlots.endTime,
            )
            .orderBy(asc(appointmentSlots.startTime));

        return NextResponse.json({
            slots,
        });
    } catch (error) {
        console.error("Failed to fetch admin slots:", error);

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