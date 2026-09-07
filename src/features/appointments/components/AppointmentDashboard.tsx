// src/features/appointments/components/AppointmentDashboard.tsx

"use client";

import Toast from "@/src/components/ui/Toast";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/src/lib/api";

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

type AppointmentDashboardProps = {
    userRole: "USER" | "ADMIN";
};

export default function AppointmentDashboard({
    userRole,
}: AppointmentDashboardProps) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [bookingId, setBookingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        title: string;
        message: string;
    } | null>(null);
    const [cancelModal, setCancelModal] = useState<Appointment | null>(null);

    async function loadData() {
        try {
            const [slotData, appointmentData] = await Promise.all([
                api<{ slots: Slot[] }>("/api/slots"),
                api<{ appointments: Appointment[] }>("/api/appointments"),
            ]);

            setSlots(slotData.slots);
            setAppointments(appointmentData.appointments);
        } catch (err) {
            setToast({
                type: "error",
                title: "Unable to load appointments",
                message:
                    err instanceof Error
                        ? err.message
                        : "Please refresh the page and try again.",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchAppointments() {
            try {
                const [slotData, appointmentData] = await Promise.all([
                    api<{ slots: Slot[] }>("/api/slots"),
                    api<{ appointments: Appointment[] }>(
                        "/api/appointments",
                    ),
                ]);

                if (cancelled) return;

                setSlots(slotData.slots);
                setAppointments(appointmentData.appointments);
            } catch (err) {
                if (cancelled) return;

                setToast({
                    type: "error",
                    title: "Unable to load appointments",
                    message:
                        err instanceof Error
                            ? err.message
                            : "Please refresh the page and try again.",
                });
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

    useEffect(() => {
        const refreshSlots = () => {
            void loadData();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshSlots();
            }
        };

        const interval = window.setInterval(refreshSlots, 20_000);

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );

        return () => {
            window.clearInterval(interval);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, []);

    async function bookSlot(slotId: string) {
        setBookingId(slotId);

        try {
            await api("/api/appointments", {
                method: "POST",
                body: JSON.stringify({ slotId }),
            });

            setToast({
                type: "success",
                title: "Appointment booked!",
                message:
                    "Your appointment has been added to your upcoming appointments.",
            });

            await loadData();
        } catch (error) {
            if (
                error instanceof ApiError &&
                error.code === "SLOT_ALREADY_BOOKED"
            ) {
                setToast({
                    type: "error",
                    title: "Slot no longer available",
                    message:
                        "Someone else booked this appointment just before you. Please choose another time.",
                });

                await loadData();

                return;
            }

            setToast({
                type: "error",
                title: "Booking failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to book appointment. Please try again.",
            });
        } finally {
            setBookingId(null);
        }
    }

    async function cancelAppointment() {
        if (!cancelModal) {
            return;
        }

        const appointment = cancelModal;

        setCancellingId(appointment.id);

        try {
            await api(`/api/appointments/${appointment.id}/cancel`, {
                method: "PATCH",
            });

            setCancelModal(null);

            setToast({
                type: "success",
                title: "Appointment cancelled",
                message:
                    "The appointment has been removed from your upcoming schedule.",
            });

            await loadData();
        } catch (err) {
            setToast({
                type: "error",
                title: "Cancellation failed",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to cancel this appointment. Please try again.",
            });
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
            {toast && (
                <div className="toast-container">
                    <Toast
                        type={toast.type}
                        title={toast.title}
                        message={toast.message}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            {cancelModal && (
                <div
                    className="cancel-modal-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setCancelModal(null);
                        }
                    }}
                >
                    <div
                        className="cancel-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-modal-title"
                    >
                        <button
                            type="button"
                            onClick={() => setCancelModal(null)}
                            className="cancel-modal-close"
                            aria-label="Close cancellation dialog"
                        >
                            ×
                        </button>

                        <div className="cancel-modal-icon" aria-hidden="true">
                            !
                        </div>

                        <h2 id="cancel-modal-title">
                            Cancel appointment?
                        </h2>

                        <p className="cancel-modal-date">
                            {formatDate(cancelModal.slot.startTime)}
                        </p>

                        <p className="cancel-modal-time">
                            {formatTime(cancelModal.slot.startTime)} –{" "}
                            {formatTime(cancelModal.slot.endTime)}
                        </p>

                        <p className="cancel-modal-description">
                            Are you sure you want to cancel this appointment?
                        </p>

                        <div className="cancel-modal-actions">
                            <button
                                type="button"
                                onClick={() => setCancelModal(null)}
                                disabled={cancellingId !== null}
                                className="cancel-modal-secondary"
                            >
                                Keep appointment
                            </button>

                            <button
                                type="button"
                                onClick={() => void cancelAppointment()}
                                disabled={cancellingId !== null}
                                className="cancel-modal-danger"
                            >
                                {cancellingId === cancelModal.id && (
                                    <span
                                        className="cancel-modal-spinner"
                                        aria-hidden="true"
                                    />
                                )}

                                {cancellingId === cancelModal.id
                                    ? "Cancelling..."
                                    : "Cancel appointment"}
                            </button>
                        </div>
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

                                {userRole === "USER" && (
                                    <button
                                        type="button"
                                        onClick={() => bookSlot(slot.id)}
                                        disabled={bookingId !== null}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {bookingId === slot.id && (
                                            <span
                                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                                aria-hidden="true"
                                            />
                                        )}

                                        {bookingId === slot.id
                                            ? "Booking..."
                                            : "Book appointment"}
                                    </button>
                                )}
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
                                                {formatDate(
                                                    appointment.slot.startTime,
                                                )}
                                            </p>

                                            <p className="mt-1 text-sm text-black">
                                                {formatTime(
                                                    appointment.slot.startTime,
                                                )}{" "}
                                                –{" "}
                                                {formatTime(
                                                    appointment.slot.endTime,
                                                )}
                                            </p>

                                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                Confirmed
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setCancelModal(appointment)}
                                        disabled={cancellingId !== null}
                                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-black transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {cancellingId === appointment.id && (
                                            <span
                                                className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600"
                                                aria-hidden="true"
                                            />
                                        )}

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
                                                {formatDate(
                                                    appointment.slot.startTime,
                                                )}
                                            </p>

                                            <p className="mt-1 text-sm text-black">
                                                {formatTime(
                                                    appointment.slot.startTime,
                                                )}{" "}
                                                –{" "}
                                                {formatTime(
                                                    appointment.slot.endTime,
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cancelled
                                                ? "bg-slate-100 text-black"
                                                : "bg-emerald-50 text-emerald-700"
                                                }`}
                                        >
                                            {cancelled
                                                ? "Cancelled"
                                                : "Completed"}
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