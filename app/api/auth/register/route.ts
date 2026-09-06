import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { hashPassword } from "@/src/lib/auth/password";
import { createSession } from "@/src/lib/auth/session";
import { registerSchema } from "@/src/features/auth/schemas/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid registration details.",
                        details: result.error.flatten().fieldErrors,
                    },
                },
                { status: 400 },
            );
        }

        const { email, password } = result.data;

        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                {
                    error: {
                        code: "EMAIL_ALREADY_EXISTS",
                        message: "An account with this email already exists.",
                    },
                },
                { status: 409 },
            );
        }

        const passwordHash = await hashPassword(password);

        const [user] = await db
            .insert(users)
            .values({
                id: randomUUID(),
                email,
                passwordHash,
                role: "USER",
            })
            .returning({
                id: users.id,
                email: users.email,
                role: users.role,
            });

        await createSession(user.id);

        return NextResponse.json(
            {
                user,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Registration failed:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Something went wrong.",
                },
            },
            { status: 500 },
        );
    }
}