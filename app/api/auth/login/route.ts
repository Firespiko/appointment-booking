import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { verifyPassword } from "@/src/lib/auth/password";
import { createSession } from "@/src/lib/auth/session";
import { loginSchema } from "@/src/features/auth/schemas/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = loginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid login details.",
                        details: result.error.flatten().fieldErrors,
                    },
                },
                { status: 400 },
            );
        }

        const { email, password } = result.data;

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CREDENTIALS",
                        message: "Invalid email or password.",
                    },
                },
                { status: 401 },
            );
        }

        const passwordValid = await verifyPassword(
            password,
            user.passwordHash,
        );

        if (!passwordValid) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CREDENTIALS",
                        message: "Invalid email or password.",
                    },
                },
                { status: 401 },
            );
        }

        await createSession(user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login failed:", error);

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