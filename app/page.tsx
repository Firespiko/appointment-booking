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

type ActivePanel = "booking" | "appointments" | "manage";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activePanel, setActivePanel] =
    useState<ActivePanel>("booking");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const data = await api<{ user: User }>(
          "/api/auth/me",
        );

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
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
      setActivePanel("booking");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await api("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setActivePanel("booking");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (!user) {
    const isLogin = authMode === "login";

    return (
      <main className="auth-page">
        <div className="auth-shell">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">
              A
            </div>

            <h1 className="auth-title">Appointer</h1>

            <p className="auth-subtitle">
              Book your next appointment in seconds.
            </p>
          </div>

          <section
            className="auth-card"
            aria-labelledby="auth-heading"
          >
            <div className="auth-card-header">
              <h2 id="auth-heading">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>

              <p>
                {isLogin
                  ? "Sign in to manage your appointments."
                  : "Get started with appointment booking."}
              </p>
            </div>

            <div
              className="auth-tabs"
              role="tablist"
              aria-label="Authentication options"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                disabled={submitting}
                className={`auth-tab ${isLogin ? "auth-tab-active" : ""
                  }`}
              >
                Sign in
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                }}
                disabled={submitting}
                className={`auth-tab ${!isLogin ? "auth-tab-active" : ""
                  }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                  disabled={submitting}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="At least 8 characters"
                  disabled={submitting}
                />

                {!isLogin && (
                  <p className="auth-helper">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {error && (
                <div role="alert" className="auth-error">
                  <span
                    className="auth-error-icon"
                    aria-hidden="true"
                  >
                    !
                  </span>

                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="auth-submit"
              >
                {submitting && (
                  <span
                    className="auth-spinner"
                    aria-hidden="true"
                  />
                )}

                <span>
                  {submitting
                    ? isLogin
                      ? "Signing in..."
                      : "Creating account..."
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
                </span>
              </button>
            </form>
          </section>

          <p className="auth-footer">
            Simple, secure appointment booking.
          </p>
        </div>
      </main>
    );
  }

  const tabs: {
    id: ActivePanel;
    label: string;
  }[] = [
      {
        id: "booking",
        label: "Book appointment",
      },
      {
        id: "appointments",
        label: "My appointments",
      },
      ...(user.role === "ADMIN"
        ? [
          {
            id: "manage" as const,
            label: "Manage slots",
          },
        ]
        : []),
    ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Appointer
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
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-800"
                  aria-hidden="true"
                />
              )}

              {loggingOut ? "Signing out..." : "Sign out"}
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

        <nav
          className="mt-8 -mx-1 overflow-x-auto px-1 pb-1 scrollbar-none"
          aria-label="Appointment navigation"
        >
          <div
            className="flex w-max min-w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-full"
            role="tablist"
          >
            {tabs.map((tab) => {
              const active = activePanel === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setActivePanel(tab.id)}
                  className={`min-w-[150px] rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 sm:min-w-0 sm:flex-1 ${active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div
          key={activePanel}
          id={`panel-${activePanel}`}
          role="tabpanel"
          aria-labelledby={`tab-${activePanel}`}
          tabIndex={0}
          className="mt-8 animate-panel-in focus:outline-none"
        >
          {activePanel === "manage" &&
            user.role === "ADMIN" ? (
            <AdminSlotManager />
          ) : (
            <AppointmentDashboard
              userRole={user.role}
              view={
                activePanel === "booking"
                  ? "booking"
                  : "appointments"
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}