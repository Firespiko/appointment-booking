// src/components/ui/Toast.tsx

"use client";

import { useEffect } from "react";

type ToastType = "success" | "error";

type ToastProps = {
    type: ToastType;
    title: string;
    message: string;
    onClose: () => void;
    duration?: number;
};

export default function Toast({
    type,
    title,
    message,
    onClose,
    duration = 4000,
}: ToastProps) {
    useEffect(() => {
        const timer = window.setTimeout(onClose, duration);

        return () => {
            window.clearTimeout(timer);
        };
    }, [duration, onClose]);

    return (
        <div
            role={type === "error" ? "alert" : "status"}
            aria-live={type === "error" ? "assertive" : "polite"}
            className="toast-overlay"
        >
            <div className={`toast-modal toast-${type}`}>
                <button
                    type="button"
                    onClick={onClose}
                    className="toast-close"
                    aria-label="Close notification"
                >
                    ×
                </button>

                <div className="toast-icon" aria-hidden="true">
                    {type === "success" ? "✓" : "!"}
                </div>

                <div className="toast-content">
                    <p className="toast-title">{title}</p>
                    <p className="toast-message">{message}</p>
                </div>
            </div>
        </div>
    );
}