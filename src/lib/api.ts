export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

export async function api<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const headers = new Headers(options?.headers);

    if (options?.body) {
        headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
        controller.abort();
    }, 8000);

    try {
        const response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
            headers,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new ApiError(
                data?.error?.message ?? "Something went wrong.",
                response.status,
                data?.error?.code,
            );
        }

        return data;
    } finally {
        window.clearTimeout(timeout);
    }
}