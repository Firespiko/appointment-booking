import { NextResponse } from "next/server";

import { deleteCurrentSession } from "@/src/lib/auth/session";

export async function POST() {
    try {
        await deleteCurrentSession();

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Logout failed:", error);

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