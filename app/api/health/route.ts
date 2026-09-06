import { NextResponse } from "next/server";

import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        await db.execute(sql`SELECT 1`);

        return NextResponse.json({
            status: "ok",
            database: "connected",
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        return NextResponse.json(
            {
                status: "error",
                database: "disconnected",
            },
            { status: 503 },
        );
    }
}