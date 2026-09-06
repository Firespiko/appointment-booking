"use client";

import { useState } from "react";

import { api } from "@/src/lib/api";

export default function AdminSlotManager() {
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    async function handleCreateSlot(event: React.FormEvent) {
        event.preventDefault();

        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            await api("/api/slots", {
                method: "POST",
                body: JSON.stringify({
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                }),
            });

            setStartTime("");
            setEndTime("");
            setSuccess("Appointment slot created successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create appointment slot.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-black">
                    Create appointment slot
                </h2>

                <p className="mt-1 text-sm text-black">
                    Add a future time slot that users can book.
                </p>
            </div>

            <form
                onSubmit={handleCreateSlot}
                className="grid gap-5 sm:grid-cols-2"
            >
                <div>
                    <label
                        htmlFor="start-time"
                        className="mb-1.5 block text-sm font-medium text-black"
                    >
                        Start time
                    </label>

                    <input
                        id="start-time"
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(event) => setStartTime(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div>
                    <label
                        htmlFor="end-time"
                        className="mb-1.5 block text-sm font-medium text-black"
                    >
                        End time
                    </label>

                    <input
                        id="end-time"
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(event) => setEndTime(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                {error && (
                    <div
                        role="alert"
                        className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="sm:col-span-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                    >
                        {success}
                    </div>
                )}

                <div className="sm:col-span-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Creating..." : "Create slot"}
                    </button>
                </div>
            </form>
        </section>
    );
}