export async function api<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.error?.message ?? "Something went wrong.",
        );
    }

    return data;
}