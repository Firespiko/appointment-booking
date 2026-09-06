"use client";

import { useEffect, useState } from "react";

import { api } from "@/src/lib/api";

type Slot = {
    id: string;
    startTime: string;
    endTime: string;
};

type Appointment = {
    id: string;
    status: "BOOKED" | "CANCELLED";
    createdAt: string;
    cancelledAt: string | null;
    slot: {
        id: string;
        startTime: string;
        endTime: string;
    };
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

function formatTime(date: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date));
}

export default function AppointmentDashboard() {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [bookingId, setBookingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    async function loadData() {
        setError("");

        try {
            const [slotData, appointmentData] = await Promise.all([
                api<{ slots: Slot[] }>("/api/slots"),
                api<{ appointments: Appointment[] }>("/api/appointments"),
            ]);

            setSlots(slotData.slots);
            setAppointments(appointmentData.appointments);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your appointments.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchAppointments() {
            setError("");

            try {
                const [slotData, appointmentData] = await Promise.all([
                    api<{ slots: Slot[] }>("/api/slots"),
                    api<{ appointments: Appointment[] }>("/api/appointments"),
                ]);

                if (cancelled) return;

                setSlots(slotData.slots);
                setAppointments(appointmentData.appointments);
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load your appointments.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchAppointments();

        return () => {
            cancelled = true;
        };
    }, []);

    async function bookSlot(slotId: string) {
        setBookingId(slotId);
        setSuccess("");
        setError("");

        try {
            await api("/api/appointments", {
                method: "POST",
                body: JSON.stringify({ slotId }),
            });

            setSuccess("Your appointment has been booked successfully.");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to book this appointment.",
            );
        } finally {
            setBookingId(null);
        }
    }

    async function cancelAppointment(appointment: Appointment) {
        const confirmed = window.confirm(
            `Cancel your appointment on ${formatDate(
                appointment.slot.startTime,
            )} at ${formatTime(appointment.slot.startTime)}?`,
        );

        if (!confirmed) {
            return;
        }

        setCancellingId(appointment.id);
        setSuccess("");
        setError("");

        try {
            await api(`/api/appointments/${appointment.id}/cancel`, {
                method: "PATCH",
            });

            setSuccess("Your appointment has been cancelled.");
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to cancel this appointment.",
            );
        } finally {
            setCancellingId(null);
        }
    }

    const upcoming = appointments.filter(
        (appointment) =>
            appointment.status === "BOOKED" &&
            new Date(appointment.slot.startTime) > new Date(),
    );

    const past = appointments.filter(
        (appointment) =>
            appointment.status === "CANCELLED" ||
            new Date(appointment.slot.endTime) <= new Date(),
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-44 animate-pulse rounded-xl bg-slate-200" />
                    <div className="h-44 animate-pulse rounded-xl bg-slate-200" />
                    <div className="h-44 animate-pulse rounded-xl bg-slate-200" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Feedback */}
            {success && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        ✓
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-emerald-900">
                            Success
                        </p>
                        <p className="text-sm text-emerald-700">
                            {success}
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        !
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-red-900">
                            Something went wrong
                        </p>
                        <p className="text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Available slots */}
            <section>
                <div className="mb-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-black">
                        Book an appointment
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Available times
                    </h2>

                    <p className="mt-1 text-sm text-black">
                        Choose a time that works for you.
                    </p>
                </div>

                {slots.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                            ○
                        </div>

                        <p className="mt-4 font-semibold text-black">
                            No appointments available
                        </p>

                        <p className="mt-1 text-sm text-black">
                            Check back later for new appointment times.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-black">
                                            {formatDate(slot.startTime)}
                                        </p>

                                        <p className="mt-1 text-sm text-black">
                                            {formatTime(slot.startTime)} –{" "}
                                            {formatTime(slot.endTime)}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                        Available
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => bookSlot(slot.id)}
                                    disabled={bookingId !== null}
                                    className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bookingId === slot.id
                                        ? "Booking..."
                                        : "Book appointment"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Upcoming appointments */}
            <section>
                <div className="mb-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-black">
                        Your schedule
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Upcoming appointments
                    </h2>
                </div>

                {upcoming.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                        <p className="font-medium text-black">
                            You have no upcoming appointments.
                        </p>

                        <p className="mt-1 text-sm text-black">
                            Book an available time above to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-black">
                                            {new Date(
                                                appointment.slot.startTime,
                                            ).getDate()}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-black">
                                                {formatDate(appointment.slot.startTime)}
                                            </p>

                                            <p className="mt-1 text-sm text-black">
                                                {formatTime(appointment.slot.startTime)} –{" "}
                                                {formatTime(appointment.slot.endTime)}
                                            </p>

                                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                Confirmed
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => cancelAppointment(appointment)}
                                        disabled={cancellingId !== null}
                                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-black transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {cancellingId === appointment.id
                                            ? "Cancelling..."
                                            : "Cancel appointment"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Past appointments */}
            <section>
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        Appointment history
                    </h2>

                    <p className="mt-1 text-sm text-black">
                        Your previous and cancelled appointments.
                    </p>
                </div>

                {past.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                        <p className="text-sm text-black">
                            No appointment history yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {past.map((appointment) => {
                            const cancelled =
                                appointment.status === "CANCELLED";

                            return (
                                <div
                                    key={appointment.id}
                                    className="rounded-xl border border-slate-200 bg-white p-5"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-black">
                                                {formatDate(appointment.slot.startTime)}
                                            </p>

                                            <p className="mt-1 text-sm text-black">
                                                {formatTime(appointment.slot.startTime)} –{" "}
                                                {formatTime(appointment.slot.endTime)}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cancelled
                                                ? "bg-slate-100 text-black"
                                                : "bg-emerald-50 text-emerald-700"
                                                }`}
                                        >
                                            {cancelled ? "Cancelled" : "Completed"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}