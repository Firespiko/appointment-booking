import { getCurrentUser } from "./session";

export async function requireUser() {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("UNAUTHENTICATED");
    }

    return user;
}

export async function requireAdmin() {
    const user = await requireUser();

    if (user.role !== "ADMIN") {
        throw new Error("FORBIDDEN");
    }

    return user;
}