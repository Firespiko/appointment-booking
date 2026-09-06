import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { db } from "@/src/db/client";
import { sessions, users } from "@/src/db/schema";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: string) {
    const sessionId = randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(
        expiresAt.getDate() + SESSION_DURATION_DAYS,
    );

    await db.insert(sessions).values({
        id: sessionId,

        userId,
        expiresAt,
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    return sessionId;
}

export async function getCurrentUser() {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get(
        SESSION_COOKIE_NAME,
    )?.value;

    if (!sessionId) {
        return null;
    }

    const result = await db
        .select({
            user: users,
            session: sessions,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(eq(sessions.id, sessionId))
        .limit(1);

    const record = result[0];

    if (!record) {
        return null;
    }

    if (record.session.expiresAt <= new Date()) {
        await db
            .delete(sessions)
            .where(eq(sessions.id, record.session.id));

        return null;
    }

    return record.user;
}

export async function deleteCurrentSession() {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get(
        SESSION_COOKIE_NAME,
    )?.value;

    if (sessionId) {
        await db
            .delete(sessions)
            .where(eq(sessions.id, sessionId));
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
}