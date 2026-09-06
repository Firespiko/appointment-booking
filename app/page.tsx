"use client";

import { useEffect, useState } from "react";
import AppointmentDashboard from "@/src/features/appointments/components/AppointmentDashboard";
import AdminSlotManager from "@/src/features/slots/components/AdminSlotManager";

import { api } from "@/src/lib/api";

type User = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await api<{ user: User }>(
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );

      setUser(data.user);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-black">
          Loading...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Appointly
            </h1>

            <p className="mt-2 text-black">
              Book your next appointment in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${authMode === "login"
                  ? "bg-white text-black shadow-sm"
                  : "text-black"
                  }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${authMode === "register"
                  ? "bg-white text-black shadow-sm"
                  : "text-black"
                  }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-black"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-black placeholder:text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-black"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-black placeholder:text-black outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Appointly
            </h1>

            <p className="text-xs text-black">
              Appointment booking
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-black sm:block">
              {user.email}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-black hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back
        </h2>

        <p className="mt-1 text-black">
          Choose an available time to book your appointment.
        </p>

        <div className="mt-8 space-y-8">
          {user.role === "ADMIN" && <AdminSlotManager />}

          <AppointmentDashboard />
        </div>
      </div>
    </main>
  );
}