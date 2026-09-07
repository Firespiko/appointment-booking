"use client";

import { useEffect, useState } from "react";

import Toast from "@/src/components/ui/Toast";
import { api } from "@/src/lib/api";

type ToastState = {
    type: "success" | "error";
    title: string;
    message: string;
} | null;

type AdminSlot = {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
};

type DeleteModalState = AdminSlot | null;

const DURATIONS = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "60 minutes" },
];

function formatPreviewDate(value: string) {
    if (!value) return "";

    return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function formatPreviewTime(value: string) {
    if (!value) return "";

    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

function getEndTime(startTime: string, duration: number) {
    if (!startTime) return "";

    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) return "";

    const end = new Date(start.getTime() + duration * 60 * 1000);

    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, "0");
    const day = String(end.getDate()).padStart(2, "0");
    const hours = String(end.getHours()).padStart(2, "0");
    const minutes = String(end.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminSlotManager() {
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState(30);

    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [startError, setStartError] = useState("");
    const [slots, setSlots] = useState<AdminSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    const [deleteModal, setDeleteModal] =
        useState<DeleteModalState>(null);

    const [toast, setToast] = useState<ToastState>(null);

    const endTime = getEndTime(startTime, duration);

    async function loadSlots() {
        try {
            const data = await api<{
                slots: AdminSlot[];
            }>("/api/slots/admin");

            setSlots(data.slots);
        } catch (err) {
            setToast({
                type: "error",
                title: "Unable to load slots",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to load your appointment slots.",
            });
        } finally {
            setLoadingSlots(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchSlots() {
            try {
                const data = await api<{
                    slots: AdminSlot[];
                }>("/api/slots/admin");

                if (!cancelled) {
                    setSlots(data.slots);
                }
            } catch (err) {
                if (!cancelled) {
                    setToast({
                        type: "error",
                        title: "Unable to load slots",
                        message:
                            err instanceof Error
                                ? err.message
                                : "Unable to load your appointment slots.",
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoadingSlots(false);
                }
            }
        }

        void fetchSlots();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleCreateSlot(event: React.FormEvent) {
        event.preventDefault();

        setStartError("");

        if (!startTime) {
            setStartError("Please select a start time.");
            return;
        }

        if (!endTime) {
            setStartError("Please select a valid start time.");
            return;
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            setStartError("Please select a valid start time.");
            return;
        }

        if (start <= new Date()) {
            setStartError("Start time must be in the future.");
            return;
        }

        setSubmitting(true);

        try {
            await api("/api/slots", {
                method: "POST",
                body: JSON.stringify({
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                }),
            });

            setStartTime("");

            setToast({
                type: "success",
                title: "Slot created",
                message:
                    "The appointment slot is now available for users to book.",
            });

            await loadSlots();
        } catch (err) {
            setToast({
                type: "error",
                title: "Unable to create slot",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to create appointment slot. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteSlot() {
        if (!deleteModal) return;

        const slot = deleteModal;

        setDeletingId(slot.id);

        try {
            await api(`/api/slots/${slot.id}`, {
                method: "DELETE",
            });

            setDeleteModal(null);

            setToast({
                type: "success",
                title: "Slot deleted",
                message: "The appointment slot has been removed.",
            });

            await loadSlots();
        } catch (err) {
            setDeleteModal(null);

            setToast({
                type: "error",
                title: "Unable to delete slot",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unable to delete appointment slot.",
            });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <>
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
                    noValidate
                    className="grid gap-5"
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
                            step={900}
                            value={startTime}
                            onChange={(event) => {
                                setStartTime(event.target.value);
                                setStartError("");
                            }}
                            aria-invalid={Boolean(startError)}
                            aria-describedby={
                                startError
                                    ? "start-time-error"
                                    : undefined
                            }
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-black outline-none transition focus:ring-2 ${startError
                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
                                }`}
                        />

                        {startError && (
                            <p
                                id="start-time-error"
                                className="mt-1.5 text-sm text-red-600"
                            >
                                {startError}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="duration"
                            className="mb-1.5 block text-sm font-medium text-black"
                        >
                            Duration
                        </label>

                        <select
                            id="duration"
                            value={duration}
                            onChange={(event) =>
                                setDuration(Number(event.target.value))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        >
                            {DURATIONS.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {startTime && endTime && !startError && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Slot preview
                            </p>

                            <p className="mt-1 font-medium text-black">
                                {formatPreviewDate(startTime)}
                            </p>

                            <p className="mt-1 text-sm text-black">
                                {formatPreviewTime(startTime)} –{" "}
                                {formatPreviewTime(endTime)}
                            </p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting && (
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                    aria-hidden="true"
                                />
                            )}

                            {submitting ? "Creating..." : "Create slot"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-black">
                        Your appointment slots
                    </h2>

                    <p className="mt-1 text-sm text-black">
                        Manage the future slots you have created.
                    </p>
                </div>

                {loadingSlots ? (
                    <div className="space-y-3">
                        {[1, 2].map((item) => (
                            <div
                                key={item}
                                className="h-20 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))}
                    </div>
                ) : slots.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
                        <p className="text-sm font-medium text-black">
                            No upcoming slots
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                            Create a slot above to make appointment times
                            available.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                            >
                                <div>
                                    <p className="font-medium text-black">
                                        {formatPreviewDate(slot.startTime)}
                                    </p>

                                    <p className="mt-1 text-sm text-black">
                                        {formatPreviewTime(slot.startTime)} –{" "}
                                        {formatPreviewTime(slot.endTime)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    {slot.isBooked ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                            Booked
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteModal(slot)
                                            }
                                            disabled={deletingId !== null}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {deleteModal && (
                <div
                    className="cancel-modal-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setDeleteModal(null);
                        }
                    }}
                >
                    <div
                        className="cancel-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-slot-title"
                    >
                        <button
                            type="button"
                            onClick={() => setDeleteModal(null)}
                            className="cancel-modal-close"
                            aria-label="Close delete dialog"
                        >
                            ×
                        </button>

                        <div
                            className="cancel-modal-icon"
                            aria-hidden="true"
                        >
                            !
                        </div>

                        <h2 id="delete-slot-title">
                            Delete appointment slot?
                        </h2>

                        <p className="cancel-modal-date">
                            {formatPreviewDate(deleteModal.startTime)}
                        </p>

                        <p className="cancel-modal-time">
                            {formatPreviewTime(deleteModal.startTime)} –{" "}
                            {formatPreviewTime(deleteModal.endTime)}
                        </p>

                        <p className="cancel-modal-description">
                            This slot has no active booking and can be safely
                            removed.
                        </p>

                        <div className="cancel-modal-actions">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                disabled={deletingId !== null}
                                className="cancel-modal-secondary"
                            >
                                Keep slot
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleDeleteSlot()}
                                disabled={deletingId !== null}
                                className="cancel-modal-danger"
                            >
                                {deletingId === deleteModal.id && (
                                    <span
                                        className="cancel-modal-spinner"
                                        aria-hidden="true"
                                    />
                                )}

                                {deletingId === deleteModal.id
                                    ? "Deleting..."
                                    : "Delete slot"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}