import { NextResponse } from "next/server";

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

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Get current user failed:", error);

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